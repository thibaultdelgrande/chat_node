const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    public: {
        type: Boolean,
        default: false
    },
    mp: {
        type: Boolean,
        default: false
    }
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
