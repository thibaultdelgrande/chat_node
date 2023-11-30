const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const router = (require("./routes/routes"));
const jwt = require("jsonwebtoken");
const Message = require("./models/message");
const Room = require("./models/room");
const { connect } = require("http2");
const User = require("./models/user");
const { emit } = require("process");
require("./db");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs")
app.use(router);

const server = createServer(app);

const io = new Server(server);

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});

let connectedUsers = {};

io.on("connection", (socket) => {
  socket.on("authentification", (token, roomId) => {
    // Vérifie si le token est valide
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decodedToken) => {
      if (err) {
        console.log(err.message);
      } else {
        socket.user = decodedToken;

        if (!connectedUsers[roomId]) {
          connectedUsers[roomId] = [];
        }
        connectedUsers[roomId].push(socket.id);

        console.log(socket.user.name + " connected in room " + roomId);
        // Récupérer tout les messages de la base de données et les envoyer au client qui vient de se connecter
        Message.find({room: roomId})
          .populate("user")
          .then((result) => {
            result.forEach((message) => {
              socket.emit("chat message", message.text, message.user.username, message.createdAt.getDate() + "/" + (message.createdAt.getMonth()+1) + "/" + message.createdAt.getFullYear() + " " + message.createdAt.getHours() + ":" + message.createdAt.getMinutes());
            });
          });
      }
    });
  });

  socket.on("auth chat", (token, second_user) => {
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decodedToken) => {
      if (err) {
        console.log(err.message);
      } else {
        socket.user = decodedToken;
        // Trouver la room correspondante
        Room.findOne({ mp: true, users: { $all: [decodedToken._id, second_user], $size: 2 }})
          .then((room) => {
            if (!room) {
              console.log("room not found");
              // Create the room
              Room.create({ mp: true, users: [decodedToken._id, second_user], name: `${decodedToken.name} - ${second_user}` })
                .then((createdRoom) => {
                  let roomId = createdRoom._id.toString();
                  console.log(socket.user.name + " connected in room " + roomId);
                  socket.emit("auth chat", roomId);
                })
                .catch((error) => {
                  console.log(error.message);
                });
            } else {
              let roomId = room._id.toString();
              console.log(socket.user.name + " connected in room " + roomId);
              socket.emit("auth chat", roomId);
            }
          })
          .catch((error) => {
            console.log(error.message);
          });
      }
    });
  });


  socket.on("chat message", (msg, room) => {
    if (!socket.user) {
      console.log("user not connected");
      return;
    }
    const message = new Message({
      text: msg,
      user: socket.user._id,
      room: room,
    });
    message.save();
    console.log(socket.user.name + " message at "+ message.createdAt + " in room " +  room +  ": " + msg);
    const roomSockets = connectedUsers[room] || [];
    roomSockets.forEach((socketId) => {
      io.to(socketId).emit("chat message", msg, socket.user.name, message.createdAt.getDate() + "/" + (message.createdAt.getMonth()+1) + "/" + message.createdAt.getFullYear() + " " + message.createdAt.getHours() + ":" + message.createdAt.getMinutes());
    });
  });

  socket.on("search user", (text) => {
    User.find({username: {$regex: text, $options: "i"}})
      .then((result) => {
        socket.emit("search user", result.map(user => ({username: user.username, _id: user._id})));
      });
  });

  socket.on("search room", (text) => {
    const userId = socket.user._id;
    Room.find({name: {$regex: text, $options: "i"}, mp: false, public: true})
      .then(async (result) => {
        const rooms = await Promise.all(result.map(async (room) => {
          const isUserInRoom = room.users.includes(userId);
          const admin = await User.findOne({_id: room.admin});
          const adminName = admin ? admin.username : "";
          return { name: room.name, _id: room._id, isUserInRoom , admin: adminName };
        }));
        socket.emit("search room", rooms);
      });
  });


  socket.on("disconnect", () => {
    if (!socket.user) {
      console.log("user not connected");
      return;
    }
    
    console.log(socket.user.name + " disconnected");

    // Retirer socket.id de tous les tableaux de connectedUsers
    Object.keys(connectedUsers).forEach((roomId) => {
      connectedUsers[roomId] = connectedUsers[roomId].filter((id) => id !== socket.id);
    });
  });
});
