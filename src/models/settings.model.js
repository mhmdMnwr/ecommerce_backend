
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    minOrderAmount: {
        type: Number,
        default: 50000
    },
});

module.exports = mongoose.model('Settings', settingsSchema);
