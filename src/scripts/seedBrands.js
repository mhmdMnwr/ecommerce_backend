const mongoose = require('mongoose');
const Brand = require('../models/brand.model');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Array of brand name prefixes and suffixes to generate unique names
const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Prime', 'Ultra', 'Super', 'Mega', 'Neo', 
    'Pro', 'Elite', 'Royal', 'Golden', 'Silver', 'Diamond', 'Crystal', 'Star', 'Sun', 'Moon',
    'Tech', 'Smart', 'Eco', 'Bio', 'Vita', 'Aero', 'Hydro', 'Electro', 'Dyna', 'Turbo'];

const suffixes = ['Corp', 'Industries', 'Labs', 'Co', 'Group', 'Solutions', 'Systems', 'Works', 'Brands', 'Global',
    'Plus', 'Max', 'Pro', 'Tech', 'Wear', 'Style', 'Home', 'Life', 'Zone', 'Hub'];

const categories = ['Electronics', 'Fashion', 'Food', 'Sports', 'Home', 'Beauty', 'Auto', 'Health', 'Kids', 'Office'];

/**
 * Generate an array of unique brand names
 * @param {number} count - Number of brands to generate
 * @returns {Array} Array of brand objects
 */
const generateBrands = (count) => {
    const brands = new Set();
    
    while (brands.size < count) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const randomNum = Math.floor(Math.random() * 1000);
        
        // Create different name patterns
        const patterns = [
            `${prefix} ${suffix}`,
            `${prefix}${category}`,
            `${category} ${prefix}`,
            `${prefix} ${category} ${suffix}`,
            `${prefix}${randomNum}`,
            `${category}${suffix}`,
        ];
        
        const brandName = patterns[Math.floor(Math.random() * patterns.length)];
        brands.add(brandName);
    }
    
    return Array.from(brands).map((title, index) => ({
        title,
        image: `brand_${index + 1}.png`
    }));
};

const seedBrands = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to DB... 🚀");

        // Generate 200 unique brands
        const brandsData = generateBrands(200);
        
        // Insert brands in batches to handle potential duplicates
        let insertedCount = 0;
        const batchSize = 50;
        
        for (let i = 0; i < brandsData.length; i += batchSize) {
            const batch = brandsData.slice(i, i + batchSize);
            try {
                const result = await Brand.insertMany(batch, { ordered: false });
                insertedCount += result.length;
                console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${result.length} brands`);
            } catch (err) {
                if (err.code === 11000) {
                    // Handle duplicate key errors - count successful inserts
                    insertedCount += err.insertedDocs?.length || 0;
                    console.log(`Batch ${Math.floor(i / batchSize) + 1}: Some duplicates skipped`);
                } else {
                    throw err;
                }
            }
        }

        console.log(`\n✅ Successfully created ${insertedCount} new brands!`);
        console.log("Seeding complete! Closing connection...");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error seeding brands:", err);
        process.exit(1);
    }
};

seedBrands();
