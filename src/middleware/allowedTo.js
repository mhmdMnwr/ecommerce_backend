// src/middleware/allowedTo.js
const AppError = require('../utils/appErrors');
const httpStatus = require('../utils/httpStatusText');

module.exports = (...roles) => {
    // roles is an array (e.g., ['sup_admin'])
    return (req, res, next) => {
        // 1. Check if verifyToken has already run
        if (!req.currentUser) {
            return next(AppError.create('User not authenticated', 401, httpStatus.ERROR));
        }

        // 2. Check if the user's role is allowed for this specific action
        if (!roles.includes(req.currentUser.role)) {
            return next(
                AppError.create(
                    `Action forbidden for ${req.currentUser.role} role`, 
                    403, 
                    httpStatus.FAIL
                )
            );
        }

        next();
    };
};