require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Product = require('../models/product.model');

const groceryProducts = [
    // Fruits
    { name: 'Fresh Apples', price: 3.99, image: 'https://example.com/apples.jpg', brand: 'Farm Fresh', category: 'Fruits', units_num: 100, state: 'available' },
    { name: 'Organic Bananas', price: 2.49, image: 'https://example.com/bananas.jpg', brand: 'Organic Valley', category: 'Fruits', units_num: 150, state: 'available' },
    { name: 'Fresh Oranges', price: 4.99, image: 'https://example.com/oranges.jpg', brand: 'Sunkist', category: 'Fruits', units_num: 80, state: 'available' },
    { name: 'Strawberries Pack', price: 5.99, image: 'https://example.com/strawberries.jpg', brand: 'Berry Best', category: 'Fruits', units_num: 60, state: 'available' },
    { name: 'Fresh Grapes', price: 4.49, image: 'https://example.com/grapes.jpg', brand: 'Farm Fresh', category: 'Fruits', units_num: 70, state: 'available' },
    
    // Vegetables
    { name: 'Fresh Tomatoes', price: 2.99, image: 'https://example.com/tomatoes.jpg', brand: 'Garden Harvest', category: 'Vegetables', units_num: 120, state: 'available' },
    { name: 'Organic Carrots', price: 1.99, image: 'https://example.com/carrots.jpg', brand: 'Organic Valley', category: 'Vegetables', units_num: 200, state: 'available' },
    { name: 'Fresh Broccoli', price: 2.49, image: 'https://example.com/broccoli.jpg', brand: 'Garden Harvest', category: 'Vegetables', units_num: 90, state: 'available' },
    { name: 'Potatoes Bag 5lb', price: 4.99, image: 'https://example.com/potatoes.jpg', brand: 'Farm Fresh', category: 'Vegetables', units_num: 100, state: 'available' },
    { name: 'Fresh Spinach', price: 3.49, image: 'https://example.com/spinach.jpg', brand: 'Organic Valley', category: 'Vegetables', units_num: 85, state: 'available' },
    { name: 'Bell Peppers Mix', price: 3.99, image: 'https://example.com/peppers.jpg', brand: 'Garden Harvest', category: 'Vegetables', units_num: 75, state: 'available' },
    { name: 'Fresh Onions', price: 1.49, image: 'https://example.com/onions.jpg', brand: 'Farm Fresh', category: 'Vegetables', units_num: 180, state: 'available' },
    
    // Dairy
    { name: 'Whole Milk 1 Gallon', price: 4.29, image: 'https://example.com/milk.jpg', brand: 'Dairy Pure', category: 'Dairy', units_num: 50, state: 'available' },
    { name: 'Greek Yogurt', price: 5.99, image: 'https://example.com/yogurt.jpg', brand: 'Chobani', category: 'Dairy', units_num: 80, state: 'available' },
    { name: 'Cheddar Cheese Block', price: 6.49, image: 'https://example.com/cheese.jpg', brand: 'Kraft', category: 'Dairy', units_num: 60, state: 'available' },
    { name: 'Butter Unsalted', price: 4.99, image: 'https://example.com/butter.jpg', brand: 'Land O Lakes', category: 'Dairy', units_num: 70, state: 'available' },
    { name: 'Eggs Large 12ct', price: 3.99, image: 'https://example.com/eggs.jpg', brand: 'Farm Fresh', category: 'Dairy', units_num: 100, state: 'available' },
    { name: 'Cream Cheese', price: 3.49, image: 'https://example.com/creamcheese.jpg', brand: 'Philadelphia', category: 'Dairy', units_num: 55, state: 'available' },
    
    // Meat & Poultry
    { name: 'Chicken Breast 1lb', price: 7.99, image: 'https://example.com/chicken.jpg', brand: 'Tyson', category: 'Meat', units_num: 40, state: 'available' },
    { name: 'Ground Beef 1lb', price: 8.99, image: 'https://example.com/beef.jpg', brand: 'Angus', category: 'Meat', units_num: 35, state: 'available' },
    { name: 'Pork Chops', price: 6.99, image: 'https://example.com/pork.jpg', brand: 'Smithfield', category: 'Meat', units_num: 30, state: 'available' },
    { name: 'Turkey Slices', price: 5.49, image: 'https://example.com/turkey.jpg', brand: 'Oscar Mayer', category: 'Meat', units_num: 45, state: 'available' },
    { name: 'Salmon Fillet', price: 12.99, image: 'https://example.com/salmon.jpg', brand: 'Atlantic', category: 'Seafood', units_num: 25, state: 'available' },
    
    // Bakery
    { name: 'White Bread Loaf', price: 2.49, image: 'https://example.com/bread.jpg', brand: 'Wonder', category: 'Bakery', units_num: 100, state: 'available' },
    { name: 'Whole Wheat Bread', price: 3.29, image: 'https://example.com/wheatbread.jpg', brand: 'Nature\'s Own', category: 'Bakery', units_num: 80, state: 'available' },
    { name: 'Croissants 6ct', price: 4.99, image: 'https://example.com/croissants.jpg', brand: 'La Boulangerie', category: 'Bakery', units_num: 40, state: 'available' },
    { name: 'Bagels Plain 6ct', price: 3.99, image: 'https://example.com/bagels.jpg', brand: 'Thomas', category: 'Bakery', units_num: 55, state: 'available' },
    
    // Beverages
    { name: 'Orange Juice 64oz', price: 4.99, image: 'https://example.com/oj.jpg', brand: 'Tropicana', category: 'Beverages', units_num: 70, state: 'available' },
    { name: 'Bottled Water 24pk', price: 5.99, image: 'https://example.com/water.jpg', brand: 'Aquafina', category: 'Beverages', units_num: 90, state: 'available' },
    { name: 'Cola 12pk', price: 6.99, image: 'https://example.com/cola.jpg', brand: 'Coca-Cola', category: 'Beverages', units_num: 85, state: 'available' },
    { name: 'Green Tea 20ct', price: 4.49, image: 'https://example.com/tea.jpg', brand: 'Lipton', category: 'Beverages', units_num: 60, state: 'available' },
    { name: 'Ground Coffee 12oz', price: 8.99, image: 'https://example.com/coffee.jpg', brand: 'Folgers', category: 'Beverages', units_num: 50, state: 'available' },
    
    // Pantry Staples
    { name: 'White Rice 5lb', price: 6.99, image: 'https://example.com/rice.jpg', brand: 'Uncle Ben\'s', category: 'Pantry', units_num: 75, state: 'available' },
    { name: 'Pasta Spaghetti', price: 1.99, image: 'https://example.com/pasta.jpg', brand: 'Barilla', category: 'Pantry', units_num: 120, state: 'available' },
    { name: 'Olive Oil 16oz', price: 9.99, image: 'https://example.com/oliveoil.jpg', brand: 'Bertolli', category: 'Pantry', units_num: 45, state: 'available' },
    { name: 'All Purpose Flour 5lb', price: 4.49, image: 'https://example.com/flour.jpg', brand: 'Gold Medal', category: 'Pantry', units_num: 65, state: 'available' },
    { name: 'Sugar 4lb', price: 3.99, image: 'https://example.com/sugar.jpg', brand: 'Domino', category: 'Pantry', units_num: 80, state: 'available' },
    { name: 'Canned Tomatoes', price: 1.49, image: 'https://example.com/cannedtomatoes.jpg', brand: 'Hunt\'s', category: 'Pantry', units_num: 150, state: 'available' },
    { name: 'Black Beans Can', price: 1.29, image: 'https://example.com/beans.jpg', brand: 'Goya', category: 'Pantry', units_num: 140, state: 'available' },
    { name: 'Peanut Butter 16oz', price: 4.99, image: 'https://example.com/peanutbutter.jpg', brand: 'Jif', category: 'Pantry', units_num: 70, state: 'available' },
    
    // Frozen Foods
    { name: 'Frozen Pizza', price: 6.99, image: 'https://example.com/frozenpizza.jpg', brand: 'DiGiorno', category: 'Frozen', units_num: 40, state: 'available' },
    { name: 'Ice Cream Vanilla', price: 5.49, image: 'https://example.com/icecream.jpg', brand: 'Ben & Jerry\'s', category: 'Frozen', units_num: 35, state: 'available' },
    { name: 'Frozen Vegetables Mix', price: 2.99, image: 'https://example.com/frozenveg.jpg', brand: 'Birds Eye', category: 'Frozen', units_num: 60, state: 'available' },
    { name: 'Frozen Berries Mix', price: 4.99, image: 'https://example.com/frozenberries.jpg', brand: 'Dole', category: 'Frozen', units_num: 50, state: 'available' },
    
    // Snacks
    { name: 'Potato Chips', price: 3.99, image: 'https://example.com/chips.jpg', brand: 'Lay\'s', category: 'Snacks', units_num: 100, state: 'available' },
    { name: 'Chocolate Cookies', price: 4.49, image: 'https://example.com/cookies.jpg', brand: 'Oreo', category: 'Snacks', units_num: 85, state: 'available' },
    { name: 'Mixed Nuts 16oz', price: 8.99, image: 'https://example.com/nuts.jpg', brand: 'Planters', category: 'Snacks', units_num: 55, state: 'available' },
    { name: 'Granola Bars 6ct', price: 4.29, image: 'https://example.com/granola.jpg', brand: 'Nature Valley', category: 'Snacks', units_num: 75, state: 'available' },
    
    // Condiments
    { name: 'Ketchup 20oz', price: 2.99, image: 'https://example.com/ketchup.jpg', brand: 'Heinz', category: 'Condiments', units_num: 90, state: 'available' },
    { name: 'Mayonnaise 30oz', price: 4.49, image: 'https://example.com/mayo.jpg', brand: 'Hellmann\'s', category: 'Condiments', units_num: 65, state: 'available' }
];

async function seedProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to database');
        
        // Optional: Clear existing products
        // await Product.deleteMany({});
        // console.log('Cleared existing products');
        
        const result = await Product.insertMany(groceryProducts);
        console.log(`Successfully inserted ${result.length} products`);
        
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
}

seedProducts();
