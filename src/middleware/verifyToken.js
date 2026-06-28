const jwt = require('jsonwebtoken');
const AppError = require('../utils/appErrors');
const httpStatusText = require('../constants/httpStatusText');
const User = require('../models/user.model');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['Authorization'] || req.headers['authorization'];
    if(!authHeader) {
        const error = AppError.create('token is required', 401, httpStatusText.FAIL);
        return next(error);
    }
    const token = authHeader.split(' ')[1];
    try {
        const currentUser = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(currentUser.id);
        if (!user) {
            return next(AppError.create('User not found', 401, httpStatusText.FAIL));
        }

        // If the token doesn't have a tokenVersion (e.g. old tokens), we treat it as 0.
        // If the user's tokenVersion is incremented, old tokens will fail.
        if ((currentUser.tokenVersion || 0) !== (user.tokenVersion || 0)) {
            return next(AppError.create('Token expired or invalid', 401, httpStatusText.FAIL));
        }

        req.currentUser = currentUser;
        next();
    } catch (err) {
        const error = AppError.create('invalid token', 401, httpStatusText.FAIL);
        return next(error);
    }
};

module.exports = verifyToken;

