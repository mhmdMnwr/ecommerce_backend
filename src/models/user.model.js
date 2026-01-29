const mongoose = require('mongoose');
const { ROLE_VALUES , ROLES } = require('../config/permissions.js');

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
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    role: {
        type: String,
        enum: ROLE_VALUES,
        default: ROLES.CUSTOMER
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },

    address: { type: String, default: '' },
    phone: { type: String, default: '' },

}, { timestamps: true });



userSchema.pre('save', async function () {
    // 1. Singleton Admin Check
    if (this.role === ROLES.ADMIN && (this.isNew || this.isModified('role'))) {
        const AdminModel = this.constructor; 
        const adminCount = await AdminModel.countDocuments({ role: ROLES.ADMIN });

        if (adminCount > 0) {
            throw new Error('Constraint Violation: Only one Admin account is allowed.');
        }
    }

    
    
    
});

module.exports = mongoose.model('User', userSchema);