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
const {globalErrorHandler , undefinedRouteHandler} = require('./middleware/globalMiddleware');
const connectDB = require('./config/db');

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
app.use(undefinedRouteHandler);


// Global error handler
app.use(globalErrorHandler);

 connectDB().then(() => {
    try {
        app.listen(port , ()=>{
            console.log(`Server is running on port ${port}`);
        }) 
    } catch (err) {
        console.log("Cannot start the server", err);
    }
 })

