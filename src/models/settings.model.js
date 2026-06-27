
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    minOrderAmount: {
        type: Number,
        default: 50000
    },
    shopPhone: {
        type: String,
        default: ''
    },
    shopLatitude: {
        type: Number,
        default: null
    },
    shopLongitude: {
        type: Number,
        default: null
    },
    developerName: {
        type: String,
        default: 'Ameur Mohammed Menouer'
    },
    developerGithub: {
        type: String,
        default: 'https://github.com/mhmdMnwr'
    },
    developerLinkedIn: {
        type: String,
        default: 'https://www.linkedin.com/in/mohammed-menouer-ameur-a0448a334/'
    },
    developerEmail: {
        type: String,
        default: 'mm.ameur@esi-sba.dz'
    },
    developerFacebook: {
        type: String,
        default: 'https://www.facebook.com/amrmhmdmnwr'
    }
}, {
    toJSON: {
        transform(doc, ret) {
            if (ret.minOrderAmount != null) ret.minOrderAmount = parseFloat(ret.minOrderAmount.toFixed(2));
            return ret;
        }
    }
});

module.exports = mongoose.model('Settings', settingsSchema);
