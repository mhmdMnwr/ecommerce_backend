const httpStatusText = require('../constants/httpStatusText');


const globalErrorHandler = (error, req, res, next) => {

    //  Handle Mongoose Invalid ID (CastError)
    if (error.name === 'CastError') {
        return  res.status(400).json({
            status: httpStatusText.FAIL,
            message: `Invalid ID format`,
            code: 400
        });
    }

    //  Handle MongoDB Duplicate Key Errors (e.g., duplicate username)
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: `That ${field} is already in use. Please try another one.`
        });
    }

    //  Handle JWT Errors (Tokens expired or invalid)
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: httpStatusText.FAIL,
            message: 'Invalid token. Please log in again.'
        });
    }
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: httpStatusText.FAIL,
            message: 'Your session has expired. Please log in again.'
        });
    }

    // General Response for AppError.create() and others
    // We default to 500/ERROR if something unexpected happens
    const statusCode = error.statusCode || 500;
    const statusText = error.statusText || httpStatusText.ERROR;

    res.status(statusCode).json({
        status: statusText,
        message: error.message || 'An internal server error occurred',
        code: statusCode,
        data: null
    });
};

const undefinedRouteHandler =(req, res) => {
  res.status(404).json({
    status: httpStatusText.FAIL,
    message: `Can't find ${req.originalUrl} on this server`
  });
} ;

module.exports = {
    globalErrorHandler,
    undefinedRouteHandler
};