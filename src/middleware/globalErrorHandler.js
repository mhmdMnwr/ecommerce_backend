const httpStatusText = require('../constants/httpStatusText');

module.exports = (error, req, res, next) => {
    // 1. Handle CastError (Invalid ID)
    if (error.name === 'CastError') {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: `Invalid ID format: ${error.value}`,
            code: 400
        });
    }

    // 2. Handle Duplicate Key (e.g., Email already exists)
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: `That ${field} is already in use.`
        });
    }

    // 3. Handle JWT Errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ status: httpStatusText.FAIL, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ status: httpStatusText.FAIL, message: 'Token expired.' });
    }

    // 4. Default Error Response
    const statusCode = error.statusCode || 500;
    const statusText = error.statusText || httpStatusText.ERROR;

    res.status(statusCode).json({
        status: statusText,
        message: error.message || 'Internal Server Error',
        code: statusCode,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
};