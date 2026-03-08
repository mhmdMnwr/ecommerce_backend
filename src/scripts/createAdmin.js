const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { Roles } = require('../constants/roles');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: Roles.ADMIN });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log(`Username: ${existingAdmin.username}`);
            console.log('❌ Cannot create another admin (singleton constraint)');
            process.exit(0);
        }

        // Admin credentials - CHANGE THESE!
        const adminData = {
            username: 'admin',
            password: 'Admin@123456', // Change this password!
            address: 'Admin Office, Algeria',
            phone: '0555000000'
        };

        // Hash the password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        // Create admin user
        const admin = new User({
            username: adminData.username,
            password: hashedPassword,
            role: Roles.ADMIN,
            status: 'active',
            address: adminData.address,
            phone: adminData.phone
        });

        await admin.save();

        console.log('✅ Admin user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Username: ${adminData.username}`);
        console.log(`Password: ${adminData.password}`);
        console.log(`Role: ${Roles.ADMIN}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  IMPORTANT: Change the password after first login!');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
};

createAdmin();
