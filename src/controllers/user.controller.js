const User = require('../models/user.model');
const httpStatus = require('../utils/httpStatusText');
const AppError = require('../utils/appErrors');
const bcrypt = require('bcryptjs');
const asyncWrapper = require('../middleware/asyncWrapper');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateJWT');
const jwt = require('jsonwebtoken');
const { ROLES } = require('../config/permissions.js');


const getAllUsers = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;
    const users = await User.find().limit(limit).skip(skip);
    res.json({
        status: 'success',
        data: {
            users
        }
    });
});



const login = asyncWrapper(async (req, res, next) => {
    const { username, password } = req.body;

    // 1. Basic Validation
    if (!username || !password) {
        return next(AppError.create('Username and password are required', 400, httpStatus.FAIL));
    }

    // 2. Find user (Username is unique)
    const user = await User.findOne({ username });
    if (!user) {
        return next(AppError.create('Invalid credentials', 401, httpStatus.FAIL));
    }

    // 3. Password Verification
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return next(AppError.create('Invalid credentials', 401, httpStatus.FAIL));
    }

    // 4. Token Generation
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

    // 5. Response Construction
    const responseData = {
        accessToken,
        refreshToken,
        user: {
            username: user.username,
            role: user.role
        }
    };

    // If it's NOT a customer (likely a Staff member on the Web Dashboard),
    // include the allowed pages to help the frontend build the sidebar.
    if (user.role !== 'customer') {
        responseData.allowedPages = ROLE_PAGES[user.role];
    }

    res.status(200).json({
        status: 'success',
        data: responseData
    });
});

const refreshToken = asyncWrapper(async (req, res) => {
    const { token } = req.body;
    if (!token) {
        throw AppError.create('Token is required', 401, httpStatus.FAIL);
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            throw AppError.create('User not found', 404, httpStatus.FAIL);
        }
        const accessToken = generateAccessToken({ id: user._id, role: user.role });
        res.json({ status: 'success', data: { accessToken } });
    } catch (err) {
        throw AppError.create('Invalid refresh token', 401, httpStatus.FAIL);
    }
});

const getMe = asyncWrapper(async (req, res) => {
    const user = await User.findById(req.currentUser.id).select('-password -__v');
    if (!user) {
        throw AppError.create('User not found', 404, httpStatus.FAIL);
    }
    res.json({
        status: 'success',
        data: user
    });
});

const registerCustomer = asyncWrapper(async (req, res, next) => {
    const { username, password, address, phone } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        username,
        password: hashedPassword,
        address,
        phone,
        role: ROLES[0] // Default to 'customer'
    });

    await newUser.save();
    res.status(201).json({ status: httpStatus.SUCCESS, data: { user: newUser } });
});

// DOOR 2: Create Staff (Strictly Sup_Admin)
const createAdminBySuper = asyncWrapper(async (req, res, next) => {
    const { username, password, role } = req.body;



    // 2. Prevent creating another sup_admin
    if (role === 'sup_admin') {
        return next(AppError.create('Cannot create another Super Admin', 400));
    }

    // 3. Validate that the role actually exists in your ROLES list
    if (!ROLES.includes(role)) {
        return next(AppError.create(`Role '${role}' does not exist in our system`, 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
        username,
        password: hashedPassword,
        role: role || 'low_admin'
    });

    await newAdmin.save();
    res.status(201).json({ status: httpStatus.SUCCESS, data: { user: newAdmin } });
});

// DOOR 3: Update Role (Strictly Sup_Admin)
const updateUserRole = asyncWrapper(async (req, res, next) => {
    const { userId, newRole } = req.body;



    // 2. Validate the newRole exists and isn't sup_admin
    if (!ROLES.includes(newRole) || newRole === 'sup_admin') {
        return next(AppError.create('Invalid or restricted role target', 400));
    }

    const user = await User.findById(userId);
    if (!user) return next(AppError.create('User not found', 404));

    // 3. Protect existing Super Admin
    if (user.role === 'sup_admin') {
        return next(AppError.create('The Super Admin account is protected', 403));
    }

    user.role = newRole;
    await user.save();

    res.status(200).json({ status: httpStatus.SUCCESS, message: `Role updated to ${newRole}` });
});






module.exports = {
    getAllUsers,
    registerCustomer,
    createAdminBySuper,
    updateUserRole,
    login,
    refreshToken,
    getMe
};

