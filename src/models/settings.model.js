
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    minOrderAmount: {
        type: Number,
        default: 50000
    },
}, {
    toJSON: {
        transform(doc, ret) {
            if (ret.minOrderAmount != null) ret.minOrderAmount = parseFloat(ret.minOrderAmount.toFixed(2));
            return ret;
        }
    }
});

module.exports = mongoose.model('Settings', settingsSchema);
