const jwt = require('jsonwebtoken');
const AppError = require('../utils/appErrors');
const httpStatusText = require('../constants/httpStatusText');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['Authorization'] || req.headers['authorization'];
    if(!authHeader) {
        const error = AppError.create('token is required', 401, httpStatusText.FAIL);
        return next(error);
    }
    const token = authHeader.split(' ')[1];
    try {
        const currentUser = jwt.verify(token, process.env.JWT_SECRET);
        req.currentUser = currentUser;
        next();
    } catch (err) {
        const error = AppError.create('invalid token', 401, httpStatusText.FAIL);
        return next(error);
    }
};

module.exports = verifyToken;

