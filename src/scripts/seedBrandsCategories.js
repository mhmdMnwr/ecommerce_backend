const mongoose = require('mongoose');
// Import your models (Adjust paths to your actual file structure)
const Brand = require('../models/brand.model'); 
const Category = require('../models/category.model');
const Product = require('../models/product.model');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });



const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL );
        console.log("Connected to DB... 🚀");

        // 1. Clear existing data
        await Brand.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});

        // 2. Create 15 Brands
        const brandNames = ['Candia', 'Apple', 'Samsung', 'Nike', 'Nestle', 'Sony', 'Adidas', 'LG', 'Dell', 'Zara', 'Beko', 'Condor', 'Ifri', 'Hamoud', 'Soummam'];
        const brands = await Brand.insertMany(brandNames.map(name => ({ title: name, image: `https://loremflickr.com/400/400/grocery,food,${encodeURIComponent(name.split(' ')[0])}` })));
        console.log("Created 15 Brands ✅");

        // 3. Create 15 Categories
        const catNames = ['Dairy', 'Electronics', 'Clothing', 'Beverages', 'Home Appliances', 'Computers', 'Footwear', 'Snacks', 'Personal Care', 'Furniture', 'Toys', 'Books', 'Tools', 'Automotive', 'Sports'];
        const categories = await Category.insertMany(catNames.map(name => ({ translation: { en: name, fr: name, ar: name }, image: `https://loremflickr.com/400/400/grocery,food,${encodeURIComponent(name.split(' ')[0])}` })));
        console.log("Created 15 Categories ✅");

        const products = [];

        // 4. Create 30 Products (With Brand and Category)
        for (let i = 1; i <= 30; i++) {
            products.push({
                title: `Premium Product ${i}`,
                price: Math.floor(Math.random() * 5000) + 100,
                image: `https://loremflickr.com/400/400/grocery,food,product`,
                units: 2,
                brand: brands[i % brands.length]._id,
                category: categories[i % categories.length]._id,
                state: 'available'
            });
        }

        // 5. Create 20 Products (WITHOUT Brand or Category)
        for (let i = 1; i <= 20; i++) {
            products.push({
                title: `Generic Item ${i}`,
                price: Math.floor(Math.random() * 1000) + 50,
                image: `https://loremflickr.com/400/400/grocery,food,item`,
                units: Math.floor(Math.random() * 200),
                brand: null, // As per your schema default
                category: null,
                state: 'available'
            });
        }

        await Product.insertMany(products);
        console.log("Created 50 Products (30 linked, 20 generic) ✅");

        console.log("Seeding complete! Closing connection...");
        process.exit();
    } catch (err) {
        console.error("Error seeding data:", err);
        process.exit(1);
    }
};

seedDB();