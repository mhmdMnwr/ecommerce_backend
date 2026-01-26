const mongoose = require('mongoose');
const { ROLES } = require('../config/permissions');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ROLES,
        default: 'customer'
    },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    createdAt: {
        type: Date,
        default: Date.now
    }

});

// Ensures only one 'sup_admin' can exist in the database
userSchema.pre('save', async function(next) {
    if (this.isModified('role') && this.role === 'sup_admin') {
        const User = mongoose.model('User');
        const existingSup = await User.findOne({ role: 'sup_admin' });
        if (existingSup && existingSup._id.toString() !== this._id.toString()) {
            throw new Error('A Super Admin already exists.');
        }
    }
    next();
});

module.exports = mongoose.model('User', userSchema);