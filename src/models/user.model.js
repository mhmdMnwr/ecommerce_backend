const mongoose = require('mongoose');
const { PERMISSION_LIST } = require('../config/permissions');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'customer' , 'sup_admin'], default: 'customer' },
    permissions: { 
        type: [String], 
        enum: PERMISSION_LIST,
        default: [] // Stores specific permissions for 'admin' users
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Ensure only one super admin exists
userSchema.index({ role: 1 }, { unique: true, partialFilterExpression: { role: 'sup_admin' } });

module.exports = mongoose.model('User', userSchema);