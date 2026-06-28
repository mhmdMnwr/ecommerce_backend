const path = require('path');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: path.resolve(process.cwd(), envFile) });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const axios = require('axios');
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
const notificationRoutes = require('./routes/notifications.routes');
const { globalErrorHandler, undefinedRouteHandler } = require('./middleware/globalMiddleware');
const connectDB = require('./config/db');
const priceFormatterMiddleware = require('./utils/priceFormatter');

// ── Security Middleware ─────────────────────────────
app.set('trust proxy', 1); // Trust first proxy (Render load balancer)
// Rate limiting: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: httpStatusText.FAIL,
        message: 'Too many requests, please try again later.',
        data: null
    }
});

// Custom NoSQL Injection Sanitizer (Compatible with Express 5 getter req.query)
const sanitizeObject = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (/^\$|\./.test(key)) {
                delete obj[key];
            } else if (typeof obj[key] === 'object') {
                sanitizeObject(obj[key]);
            }
        }
    }
};

const sanitizeMiddleware = (req, res, next) => {
    ['body', 'params', 'query'].forEach((k) => {
        if (req[k]) sanitizeObject(req[k]);
    });
    next();
};

// ── Security Headers ────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : [];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json({ limit: '10kb' }));
app.use(limiter);
app.use(sanitizeMiddleware);
app.use(priceFormatterMiddleware);

app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/brands', brandRoutes);
app.use('/categories', categoryRoutes);
app.use('/feedbacks', feedbackRoutes);
app.use('/orders', orderRoutes);
app.use('/settings', settingsRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/notifications', notificationRoutes);


// ── Keep-Alive Cron Job ─────────────────────────────
// Simple ping route to keep the server awake
app.get('/ping', (req, res) => {
    res.status(200).json({ message: 'pong' });
});

// Cron job to ping the server every 14 minutes
cron.schedule('*/14 * * * *', () => {
    const serverUrl = process.env.SERVER_URL || `http://localhost:${port}`;
    axios.get(`${serverUrl}/ping`)
        .then(() => console.log('Keep-alive ping successful'))
        .catch((err) => console.error('Keep-alive ping failed:', err.message));
});

// Catch-all for undefined routes
app.use(undefinedRouteHandler);


// Global error handler
app.use(globalErrorHandler);

connectDB().then(() => {
    try {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        })
    } catch (err) {
        console.log("Cannot start the server", err);
    }
})
