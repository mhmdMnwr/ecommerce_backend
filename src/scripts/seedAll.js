const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Brand = require('../models/brand.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const Feedback = require('../models/feedback.model');
const { Roles } = require('../constants/roles');
const { OrderStatus } = require('../constants/orderStatus');
const { ProductStatus } = require('../constants/productStatus');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    BRANDS: 20,
    CATEGORIES: 15,
    PRODUCTS: 400,
    CUSTOMERS: 200,
    ORDERS: 3000,
    FEEDBACKS: 100,
    DATE_RANGE_YEARS: 2 // Data spread over last 2 years
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a random date between start and end dates
 */
const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

/**
 * Get random item from array
 */
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Get random number between min and max
 */
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generate date range for seeding
 */
const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - CONFIG.DATE_RANGE_YEARS);
    return { start, end };
};

// ============================================
// DATA GENERATORS
// ============================================

const brandNames = [
    'Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus',
    'Puma', 'Reebok', 'Canon', 'Nikon', 'Philips', 'Panasonic', 'Bose', 'JBL', 'Logitech', 'Microsoft',
    'Nestle', 'Coca-Cola', 'Pepsi', 'Unilever', 'P&G', 'Colgate', 'Johnson', 'Gillette', 'Nivea', 'Dove'
];

const categoryNames = [
    'Electronics', 'Clothing', 'Footwear', 'Home Appliances', 'Computers',
    'Mobile Phones', 'Audio', 'Cameras', 'Gaming', 'Sports',
    'Beauty', 'Health', 'Food & Beverages', 'Kitchen', 'Furniture'
];

const productAdjectives = ['Premium', 'Ultra', 'Pro', 'Max', 'Lite', 'Classic', 'Modern', 'Elite', 'Smart', 'Wireless'];
const productNouns = ['Device', 'Gadget', 'Item', 'Product', 'Gear', 'System', 'Kit', 'Set', 'Pack', 'Bundle'];

const firstNames = ['John', 'Jane', 'Mike', 'Sara', 'Alex', 'Emma', 'David', 'Lisa', 'Chris', 'Anna',
    'Ahmed', 'Fatima', 'Omar', 'Aisha', 'Youssef', 'Meryem', 'Karim', 'Nadia', 'Hassan', 'Leila'];
const lastNames = ['Smith', 'Johnson', 'Brown', 'Wilson', 'Lee', 'Garcia', 'Martinez', 'Chen', 'Ali', 'Kumar'];

const feedbackComments = [
    'Great service! Will order again.',
    'Fast delivery, excellent quality.',
    'Product was exactly as described.',
    'Very satisfied with my purchase.',
    'Good value for money.',
    'Customer support was helpful.',
    'Packaging was secure and neat.',
    'Highly recommend this store!',
    'Products are authentic and genuine.',
    'Easy ordering process.',
    'Prices are competitive.',
    'Quality exceeded my expectations.',
    'Will definitely come back.',
    'Smooth transaction experience.',
    'Thank you for the quick response!'
];

// ============================================
// SEED FUNCTIONS
// ============================================

const seedBrands = async () => {
    console.log('🏷️  Clearing existing brands...');
    await Brand.deleteMany({});
    
    const { start, end } = getDateRange();
    const brands = brandNames.slice(0, CONFIG.BRANDS).map(name => ({
        title: name,
        image: `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_logo.png`,
        createdAt: randomDate(start, end)
    }));
    
    const result = await Brand.insertMany(brands);
    console.log(`✅ Created ${result.length} brands`);
    return result;
};

const seedCategories = async () => {
    console.log('📁 Clearing existing categories...');
    await Category.deleteMany({});
    
    const { start, end } = getDateRange();
    const categories = categoryNames.slice(0, CONFIG.CATEGORIES).map(name => ({
        title: name,
        image: `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_img.png`,
        createdAt: randomDate(start, end)
    }));
    
    const result = await Category.insertMany(categories);
    console.log(`✅ Created ${result.length} categories`);
    return result;
};

const seedProducts = async (brands, categories) => {
    console.log('📦 Clearing existing products...');
    await Product.deleteMany({});
    
    const { start, end } = getDateRange();
    const products = [];
    const usedTitles = new Set();
    
    for (let i = 0; i < CONFIG.PRODUCTS; i++) {
        let title;
        do {
            const adj = randomItem(productAdjectives);
            const noun = randomItem(productNouns);
            const num = randomInt(100, 9999);
            title = `${adj} ${noun} ${num}`;
        } while (usedTitles.has(title));
        usedTitles.add(title);
        
        const hasBrand = Math.random() > 0.2; // 80% have brand
        const hasCategory = Math.random() > 0.15; // 85% have category
        
        products.push({
            title,
            price: randomInt(500, 50000),
            image: `product_${i + 1}.png`,
            brand: hasBrand ? randomItem(brands)._id : null,
            category: hasCategory ? randomItem(categories)._id : null,
            units: randomInt(1, 10),
            totalSold: 0,
            totalRevenue: 0,
            state: Math.random() > 0.1 ? ProductStatus.AVAILABLE : ProductStatus.UNAVAILABLE,
            createdAt: randomDate(start, end)
        });
    }
    
    const result = await Product.insertMany(products);
    console.log(`✅ Created ${result.length} products`);
    return result;
};

const seedCustomers = async () => {
    console.log('👥 Adding new customers (keeping existing users)...');
    
    const { start, end } = getDateRange();
    const hashedPassword = await bcrypt.hash('password123', 10);
    const customers = [];
    const usedUsernames = new Set();
    
    // Get existing usernames to avoid duplicates
    const existingUsers = await User.find({}).select('username');
    existingUsers.forEach(u => usedUsernames.add(u.username.toLowerCase()));
    
    for (let i = 0; i < CONFIG.CUSTOMERS; i++) {
        let username;
        do {
            const first = randomItem(firstNames);
            const last = randomItem(lastNames);
            const num = randomInt(1, 9999);
            username = `${first}${last}${num}`;
        } while (usedUsernames.has(username.toLowerCase()));
        usedUsernames.add(username.toLowerCase());
        
        const customerDate = randomDate(start, end);
        
        customers.push({
            username,
            password: hashedPassword,
            role: Roles.CUSTOMER,
            status: 'active',
            address: `${randomInt(1, 999)} Street ${randomInt(1, 50)}, City ${randomInt(1, 20)}`,
            phone: `05${randomInt(10000000, 99999999)}`,
            totalOrders: 0,
            totalSpent: 0,
            createdAt: customerDate,
            updatedAt: customerDate
        });
    }
    
    const result = await User.insertMany(customers);
    console.log(`✅ Created ${result.length} customers`);
    return result;
};

const seedOrders = async (customers, products) => {
    console.log('🛒 Clearing existing orders...');
    await Order.deleteMany({});
    
    const { start, end } = getDateRange();
    const orders = [];
    const statuses = [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED];
    const statusWeights = [0.1, 0.1, 0.1, 0.6, 0.1]; // 60% delivered for revenue stats
    
    // Create a weighted status picker
    const pickStatus = () => {
        const rand = Math.random();
        let cumulative = 0;
        for (let i = 0; i < statuses.length; i++) {
            cumulative += statusWeights[i];
            if (rand <= cumulative) return statuses[i];
        }
        return OrderStatus.DELIVERED;
    };
    
    // Track customer stats for updating
    const customerStats = {};
    
    for (let i = 0; i < CONFIG.ORDERS; i++) {
        const customer = randomItem(customers);
        const orderDate = randomDate(start, end);
        const status = pickStatus();
        
        // Generate 1-5 items per order
        const itemCount = randomInt(1, 5);
        const items = [];
        let totalAmount = 0;
        const usedProducts = new Set();
        
        for (let j = 0; j < itemCount; j++) {
            let product;
            do {
                product = randomItem(products);
            } while (usedProducts.has(product._id.toString()) && usedProducts.size < products.length);
            usedProducts.add(product._id.toString());
            
            const quantity = randomInt(1, 5);
            const itemTotal = product.price * quantity;
            totalAmount += itemTotal;
            
            items.push({
                productId: product._id,
                quantity,
                units: product.units,
                price: product.price
            });
        }
        
        // Update customer stats tracking
        if (!customerStats[customer._id]) {
            customerStats[customer._id] = { orders: 0, spent: 0 };
        }
        customerStats[customer._id].orders++;
        if (status === OrderStatus.DELIVERED) {
            customerStats[customer._id].spent += totalAmount;
        }
        
        // Create order with dates
        const updatedAt = status === OrderStatus.DELIVERED 
            ? new Date(orderDate.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000) // 1-14 days after creation
            : orderDate;
        
        orders.push({
            customerId: customer._id,
            items,
            totalAmount,
            status,
            comment: Math.random() > 0.7 ? feedbackComments[randomInt(0, feedbackComments.length - 1)] : '',
            createdAt: orderDate,
            updatedAt: updatedAt
        });
    }
    
    const result = await Order.insertMany(orders);
    console.log(`✅ Created ${result.length} orders`);
    
    // Update customer totalOrders and totalSpent
    console.log('📊 Updating customer statistics...');
    const bulkOps = Object.entries(customerStats).map(([customerId, stats]) => ({
        updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(customerId) },
            update: { $inc: { totalOrders: stats.orders, totalSpent: stats.spent } }
        }
    }));
    
    if (bulkOps.length > 0) {
        await User.bulkWrite(bulkOps);
        console.log(`✅ Updated stats for ${bulkOps.length} customers`);
    }
    
    return result;
};

const seedFeedbacks = async (customers) => {
    console.log('💬 Clearing existing feedbacks...');
    await Feedback.deleteMany({});
    
    const { start, end } = getDateRange();
    const feedbacks = [];
    
    for (let i = 0; i < CONFIG.FEEDBACKS; i++) {
        const feedbackDate = randomDate(start, end);
        feedbacks.push({
            customer: randomItem(customers)._id,
            comment: randomItem(feedbackComments),
            createdAt: feedbackDate,
            updatedAt: feedbackDate
        });
    }
    
    const result = await Feedback.insertMany(feedbacks);
    console.log(`✅ Created ${result.length} feedbacks`);
    return result;
};

// ============================================
// MAIN SEED FUNCTION
// ============================================

const seedDatabase = async () => {
    try {
        console.log('\n🚀 Starting database seeding...\n');
        console.log('📋 Configuration:');
        console.log(`   - Brands: ${CONFIG.BRANDS}`);
        console.log(`   - Categories: ${CONFIG.CATEGORIES}`);
        console.log(`   - Products: ${CONFIG.PRODUCTS}`);
        console.log(`   - Customers: ${CONFIG.CUSTOMERS} (new)`);
        console.log(`   - Orders: ${CONFIG.ORDERS}`);
        console.log(`   - Feedbacks: ${CONFIG.FEEDBACKS}`);
        console.log(`   - Date Range: Last ${CONFIG.DATE_RANGE_YEARS} years\n`);
        
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB\n');
        
        // Seed in order of dependencies
        const brands = await seedBrands();
        const categories = await seedCategories();
        const products = await seedProducts(brands, categories);
        const customers = await seedCustomers();
        await seedOrders(customers, products);
        await seedFeedbacks(customers);
        
        console.log('\n🎉 Database seeding completed successfully!\n');
        
        // Print summary
        console.log('📊 Final Database State:');
        const [brandCount, catCount, prodCount, userCount, orderCount, feedbackCount] = await Promise.all([
            Brand.countDocuments(),
            Category.countDocuments(),
            Product.countDocuments(),
            User.countDocuments(),
            Order.countDocuments(),
            Feedback.countDocuments()
        ]);
        console.log(`   - Brands: ${brandCount}`);
        console.log(`   - Categories: ${catCount}`);
        console.log(`   - Products: ${prodCount}`);
        console.log(`   - Total Users: ${userCount}`);
        console.log(`   - Orders: ${orderCount}`);
        console.log(`   - Feedbacks: ${feedbackCount}`);
        
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error seeding database:', err);
        process.exit(1);
    }
};

seedDatabase();
