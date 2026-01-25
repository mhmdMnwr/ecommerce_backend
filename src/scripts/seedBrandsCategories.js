require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Brand = require('../models/brand.model');
const Category = require('../models/category.model');

const brands = [
    { name: 'Farm Fresh', image: 'https://example.com/brands/farmfresh.jpg' },
    { name: 'Organic Valley', image: 'https://example.com/brands/organicvalley.jpg' },
    { name: 'Dairy Pure', image: 'https://example.com/brands/dairypure.jpg' },
    { name: 'Nature\'s Best', image: 'https://example.com/brands/naturesbest.jpg' },
    { name: 'Green Harvest', image: 'https://example.com/brands/greenharvest.jpg' },
    { name: 'Fresh Fields', image: 'https://example.com/brands/freshfields.jpg' },
    { name: 'Golden Grain', image: 'https://example.com/brands/goldengrain.jpg' },
    { name: 'Pure Delights', image: 'https://example.com/brands/puredelights.jpg' },
    { name: 'Healthy Choice', image: 'https://example.com/brands/healthychoice.jpg' },
    { name: 'Premium Select', image: 'https://example.com/brands/premiumselect.jpg' }
];

const categories = [
    { name: 'Fruits', image: 'https://example.com/categories/fruits.jpg' },
    { name: 'Vegetables', image: 'https://example.com/categories/vegetables.jpg' },
    { name: 'Dairy', image: 'https://example.com/categories/dairy.jpg' },
    { name: 'Meat', image: 'https://example.com/categories/meat.jpg' },
    { name: 'Seafood', image: 'https://example.com/categories/seafood.jpg' },
    { name: 'Bakery', image: 'https://example.com/categories/bakery.jpg' },
    { name: 'Beverages', image: 'https://example.com/categories/beverages.jpg' },
    { name: 'Pantry', image: 'https://example.com/categories/pantry.jpg' },
    { name: 'Frozen', image: 'https://example.com/categories/frozen.jpg' },
    { name: 'Snacks', image: 'https://example.com/categories/snacks.jpg' }
];

async function seedBrandsAndCategories() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to database');

        // Insert brands
        const brandResult = await Brand.insertMany(brands);
        console.log(`Successfully inserted ${brandResult.length} brands`);

        // Insert categories
        const categoryResult = await Category.insertMany(categories);
        console.log(`Successfully inserted ${categoryResult.length} categories`);

        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding brands and categories:', error);
        process.exit(1);
    }
}

seedBrandsAndCategories();
