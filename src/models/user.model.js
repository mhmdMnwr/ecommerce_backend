const mongoose = require('mongoose');
const {ROLES} = require('../config/permissions');

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
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Ensures only one 'sup_admin' can exist in the database
userSchema.index(
    { role: 1 }, 
    { unique: true, partialFilterExpression: { role: 'sup_admin' } }
);

module.exports = mongoose.model('User', userSchema);