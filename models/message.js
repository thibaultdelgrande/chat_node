const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null
    }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
