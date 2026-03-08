// src/middleware/allowedTo.js
const AppError = require('../utils/appErrors');
const httpStatus = require('../constants/httpStatusText');
const User = require('../models/user.model');

const allowedTo = (...Roles) => {
    return async (req, res, next) => {
        // 1. We already have the ID from verifyToken
        const userId = req.currentUser.id;

        // 2. LEAN QUERY: Only fetch 'status' and 'role'
        // .lean() makes it a plain JS object (faster)
        const user = await User.findById(userId).select('status role').lean();

        if (!user) {
            return next(AppError.create('User no longer exists', 404));
        }

        // 3. The Real-Time Status Check
        if (user.status !== 'active') {
            return next(AppError.create('Account deactivated', 403));
        }

        // 4. Role Authorization
        if (!Roles.includes(user.role)) {
            return next(AppError.create('You do not have permission', 403));
        }

        next();
    };
};

module.exports = allowedTo;