const Room = require('../models/room');
const jwt = require("jsonwebtoken");

exports.newRoom = (req, res, mp = false, user = null) => {
    const { roomName, public } = req.body;
    const token = req.cookies.jwt;
    if (!token) {
        res.redirect('/login');
        return;
    }
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
        if (err) {
            console.log(err.message);
            res.redirect('/login');
            return;
        }
        if (mp) {
            console.log(user.username + " created room with " + decodedToken.name)
            const room = new Room({
                name: user.username + " - " + decodedToken.name,
                admin: null,
                public: false,
                users: [user._id, decodedToken._id],
                mp: mp
            });
            await room.save();
            console.log(decodedToken.name + " created room " + room._id + " : " + room.name)
            res.redirect('/chat/' + user._id);
            return;
        }
        else {
            const room = new Room({
                name: roomName,
                admin: decodedToken._id,
                public: public,
                users: [decodedToken._id],
                mp: mp
            });
            await room.save();
            console.log(decodedToken.name + " created room " + room._id + " : " + room.name)
            res.redirect('/room/' + room._id); 
        }
    });
}

exports.joinRoom = (req, res) => {
    const { roomId } = req.body;
    const token = req.cookies.jwt;
    if (!token) {
        res.redirect('/login');
        return;
    }
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
        if (err) {
            console.log(err.message);
            res.redirect('/login');
            return;
        }
        const room = await Room.findById(roomId);
        if (!room) {
            console.log("Room not found");
            res.redirect('/');
            return;
        }
        if (room.public == false) {
            console.log("Room is private");
            res.redirect('/');
            return;
        }
        room.users.push(decodedToken._id);
        await room.save();
        console.log(decodedToken.name + " joined room " + room.name);
        res.redirect('/room/' + roomId);
    });
}

exports.leaveRoom = (req, res) => {
    const { roomId } = req.body;
    const token = req.cookies.jwt;
    if (!token) {
        res.redirect('/login');
        return;
    }
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
        if (err) {
            console.log(err.message);
            res.redirect('/login');
            return;
        }
        const room = await Room.findById(roomId);
        if (!room) {
            console.log("Room not found");
            res.redirect('/');
            return;
        }
        if (room.public == false) {
            console.log("Room is private");
            res.redirect('/');
            return;
        }
        room.users.pull(decodedToken._id);
        await room.save();
        console.log(decodedToken.name + " left room " + room.name);
        res.redirect('/');
    });
}

exports.deleteRoom = (req, res) => {
    const { roomId } = req.body;
    const token = req.cookies.jwt;
    if (!token) {
        res.redirect('/login');
        return;
    }
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
        if (err) {
            console.log(err.message);
            res.redirect('/login');
            return;
        }
        const room = await Room.findById(roomId);
        if (!room) {
            console.log("Room not found");
            res.redirect('/');
            return;
        }
        if (room.admin != decodedToken._id) {
            console.log("User is not admin");
            res.redirect('/');
            return;
        }
        await room.delete();
        console.log(decodedToken.name + " deleted room " + room.name);
        res.redirect('/');
    });
}

exports.addUser = (req, res) => {
    const { roomId, userId } = req.body;
    const token = req.cookies.jwt;
    if (!token) {
        res.redirect('/login');
        return;
    }

}