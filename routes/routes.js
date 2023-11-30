const { Router } = require('express');
const auth = require('../controllers/authController');
const roomController = require('../controllers/roomController');
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const Room = require('../models/room');
const User = require('../models/user');

const router = Router();
router.use(cookieParser());


router.get('/', async (req, res) => {
    if (req.cookies.jwt) {
        /* Récupère la liste de room dont l'utilisateur est admin */
        const token = req.cookies.jwt;
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
        const adminRooms = await Room.find({ admin: decodedToken._id });
        const chatRooms = await Room.find({ mp: true, users: { $in: [decodedToken._id.toString()] } });
        /* Changer chatRooms pour qu'il ne contienne que l'id de l'autre utilisateur ainsi que son nom */
        const updatedChatRooms = await Promise.all(chatRooms.map(async (room) => {
            let users = room.users;
            users = users.filter((user) => {
                return user != decodedToken._id.toString();
            });
            const user = await User.findById(users[0]);
            const username = user.username;
            return { _id: users[0]._id.toString(), name: username };
        }));
        const joinedRooms = await Room.find({ mp: false, users: { $in: [decodedToken._id.toString()] }, admin: { $ne: decodedToken._id } });
        res.render('../views/index.ejs', {
            roomId: null,
            rooms: adminRooms,
            roomName: "Main room",
            chatRooms: updatedChatRooms,
            joinedRooms: joinedRooms,
        });
        return;
    }
    res.redirect('/login');
});

/* Auth routes */

router.get('/login', (req, res) => {
    res.render('../views/login.ejs');
});

router.get('/register', (req, res) => {
    res.render('../views/register.ejs');
});

router.post('/login', (req, res) => {
    auth.login(req, res);
});

router.post('/register', (req, res) => {
    auth.register(req, res);
});

router.get('/logout', (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
}
);

/* Room routes */

router.get('/newRoom', (req, res) => {
    if (req.cookies.jwt) {
        res.render('../views/newRoom.ejs');
        return;
    }
    res.redirect('/login');
}
);

router.post('/newRoom', (req, res) => {
    roomController.newRoom(req, res);
});

router.get('/room/:id', async (req, res) => {
    if (req.cookies.jwt) {
        try {
            const room = await Room.findById(req.params.id);
            if (!room) {
                res.redirect('/');
                return;
            }

            if (room.mp) {
                res.redirect('/');
                return;
            }

            /* Si l'utilisateur n'est pas dans la room */
            const token = req.cookies.jwt;
            const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
            const user = decodedToken._id;
            const users = room.users;

            if (!users.includes(user)) {
                if (room.public) {
                    room.users.push(user);
                    await room.save();
                } else {
                    res.redirect('/');
                    return;
                }
            }

            const adminRooms = await Room.find({ admin: decodedToken._id });
            const chatRooms = await Room.find({ mp: true, users: { $in: [decodedToken._id.toString()] } });

            /* Changer chatRooms pour qu'il ne contienne que l'id de l'autre utilisateur ainsi que son nom */
            const modifiedChatRooms = await Promise.all(chatRooms.map(async (room) => {
                let users = room.users;
                users = users.filter((user) => {
                    return user != decodedToken._id.toString();
                });
                const userObj = await User.findById(users[0]);
                const username = userObj.username;
                return { _id: users[0]._id.toString(), name: username };
            }));

            const joinedRooms = await Room.find({ mp: false, users: { $in: [decodedToken._id.toString()] }, admin: { $ne: decodedToken._id } });

            res.render('../views/index.ejs', {
                roomId: room._id.toString(),
                rooms: adminRooms,
                roomName: room.name,
                chatRooms: modifiedChatRooms,
                joinedRooms: joinedRooms,
            });
        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
        return;
    }
    res.redirect('/login');
});


/* Chat routes */
router.get("/chat/:id", async (req, res) => {
    if (req.cookies.jwt) {
        /* Décoder le token */
        const token = req.cookies.jwt;
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
        /* Si le token n'est pas valide */
        if (!decodedToken) {
            res.redirect('/login');
            return;
        }

        try {
            /* Vérifie si l'utilisateur correspondant à l'id existe */
            const user = await User.findById(req.params.id);
            if (!user) {
                res.redirect('/');
                return;
            }

            const rooms = await Room.find({ mp: true, users: { $in: [decodedToken._id, user._id.toString()] }});
            if (rooms.length == 0) {
                await roomController.newRoom(req, res, true, user);
                return;
            }

            let roomId = user._id.toString();
            const adminRooms = await Room.find({ admin: decodedToken._id });
            const chatRooms = await Room.find({ mp: true, users: { $in: [decodedToken._id.toString()] } });

            /* Changer chatRooms pour qu'il ne contienne que l'id de l'autre utilisateur ainsi que son nom */
            const modifiedChatRooms = await Promise.all(chatRooms.map(async (room) => {
                let users = room.users;
                users = users.filter((user) => {
                    return user != decodedToken._id.toString();
                });
                const user = await User.findById(users[0]);
                const username = user.username;
                return { _id: users[0]._id.toString(), name: username };
            }));

            const joinedRooms = await Room.find({ mp: false, users: { $in: [decodedToken._id.toString()] }, admin: { $ne: decodedToken._id } });

            console.log(roomId, chatRooms)
            res.render('../views/index.ejs', {
                roomId: roomId,
                rooms: adminRooms,
                roomName: user.username,
                chatRooms: modifiedChatRooms,
                joinedRooms: joinedRooms,
            });
        } catch (error) {
            console.error(error);
            res.redirect('/login');
        }
        return;
    }
    res.redirect('/login');
});


// "/rooms" affiche toute les rooms publiques
router.get("/rooms", async (req, res) => {
    if (req.cookies.jwt) {
        res.render('../views/rooms.ejs');
        return;
    }
    res.redirect('/login');
});

module.exports = router;