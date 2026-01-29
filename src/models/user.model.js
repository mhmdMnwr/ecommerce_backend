const mongoose = require('mongoose');
const { RoleValues , Roles } = require('../constants/roles.js');
const { UserStatus , StatusValues } = require('../constants/userStatus.js');
const AppError = require('../utils/appErrors.js');

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
        enum: StatusValues,
        default: UserStatus.ACTIVE
    },
    role: {
        type: String,
        enum: RoleValues,
        default: Roles.CUSTOMER
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
    if (this.role === Roles.ADMIN && (this.isNew || this.isModified('role'))) {
        const AdminModel = this.constructor; 
        const adminCount = await AdminModel.countDocuments({ role: Roles.ADMIN });

        if (adminCount > 0) {
            
            throw AppError.create('Constraint Violation: Only one Admin account is allowed.', 400, httpStatus.FAIL);
        }
    }

    
    
    
});

module.exports = mongoose.model('User', userSchema);