/**
 * @file seedOrders.js
 * Standalone script to populate the database with 100 valid orders.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model'); // Ensure path is correct
const { OrderStatus } = require('../constants/orderStatus');


const seedOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL );
        console.log('Connected to Database...');

        // 1. Fetch dependencies
        const customers = await User.find({ role: 'customer' });
        const products = await Product.find({ state: 'available' });

        if (customers.length === 0 || products.length === 0) {
           throw new Error('Pre-requisite missing: Seed Users (customers) and Products first.');
        }

        // 2. Clear existing orders for a clean state
        await Order.deleteMany({});
        console.log('Existing orders cleared.');

        const orders = [];

        for (let i = 0; i < 100; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            
            // Generate 1 to 4 unique items per order
            const itemCount = Math.floor(Math.random() * 4) + 1;
            const selectedProducts = products
                .sort(() => 0.5 - Math.random())
                .slice(0, itemCount);

            let totalAmount = 0;
            const items = selectedProducts.map(prod => {
                const qty = Math.floor(Math.random() * 3) + 1;
                const lineTotal = prod.price * qty;
                totalAmount += lineTotal;

                return {
                    productId: prod._id,
                    title: prod.title,
                    quantity: qty,
                    units: prod.units || 1, // Compliance with schema
                    price: prod.price
                };
            });

            // Random status distribution
            const statusKeys = Object.values(OrderStatus);
            const status = statusKeys[Math.floor(Math.random() * statusKeys.length)];

            orders.push({
                customerId: customer._id,
                items: items,
                totalAmount: Math.round(totalAmount * 100) / 100,
                status: status,
                // Spread creation dates over the last 60 days for realistic analytics
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000))
            });
        }

        // 3. Bulk Insert for performance
        await Order.insertMany(orders);
        console.log(`Successfully seeded 100 orders for ${customers.length} customers.`);

    } catch (error) {
        console.error('Seeding Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

seedOrders();