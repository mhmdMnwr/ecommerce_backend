require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const url = process.env.MONGO_URL;
const port = process.env.PORT;
const userRoutes = require('./routes/users.routes');
const productRoutes = require('./routes/products.routes');
const brandRoutes = require('./routes/brands.routes');
const categoryRoutes = require('./routes/categories.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const httpStatusText = require('./constants/httpStatusText');
const orderRoutes = require('./routes/orders.routes');
const settingsRoutes = require('./routes/settings.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

app.use(cors());
app.use(express.json());

app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/brands', brandRoutes);
app.use('/categories', categoryRoutes);
app.use('/feedbacks', feedbackRoutes);
app.use('/orders', orderRoutes);
app.use('/settings' , settingsRoutes);
app.use('/dashboard' , dashboardRoutes)


// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    status: httpStatusText.FAIL,
    message: `Can't find ${req.originalUrl} on this server`
  });
});


// Global error handler
app.use((error, req, res, next) => {

    //  Handle Mongoose Invalid ID (CastError)
    if (error.name === 'CastError') {
        return  res.status(400).json({
            status: 'fail',
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
});


mongoose.connect(url).then(()=>{
    console.log("Connected to the database");
    app.listen(port , ()=>{
        console.log(`Server is running on port ${port}`);
    })
})
.catch((err)=>{
    console.log("Cannot connect to the database", err);
    process.exit();
});


