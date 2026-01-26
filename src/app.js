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
const httpStatusText = require('./utils/httpStatusText');
const orderRoutes = require('./routes/orders.routes');

app.use(cors());
app.use(express.json());

app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/brands', brandRoutes);
app.use('/categories', categoryRoutes);
app.use('/feedbacks', feedbackRoutes);
app.use('/orders', orderRoutes);


// Global error handler
app.use((error, req, res, next) => {
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(400).json({
            status: 'fail',
            message: `That ${field} is already in use. Please try another one.`
        });
    }
    
    res.status(error.statusCode || 500).json({
        status: error.statusText || httpStatusText.ERROR,
        message: error.message,
        code: error.statusCode || 500,
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


