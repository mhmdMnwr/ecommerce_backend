require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const url = process.env.MONGO_URL;
const port = process.env.PORT;
const userRoutes = require('./routes/users.routes');
const httpStatusText = require('./utils/httpStatusText');

app.use(cors());
app.use(express.json());

app.use('/users', userRoutes);

// Global error handler
app.use((error, req, res, next) => {
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


