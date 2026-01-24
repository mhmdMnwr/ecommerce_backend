const User = require('../models/user.model');
const httpStatus = require('../utils/httpStatusText');
const AppError = require('../utils/appErrors');
const bcrypt = require('bcryptjs');
const asyncWrapper = require('../middleware/asyncWrapper');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateJWT');
const jwt = require('jsonwebtoken');

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

const register = asyncWrapper(async (req, res) => {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ $or: [ { username }, { email } ] });
    if (existingUser) {
        throw AppError.create('Username or email already exists', 400, httpStatus.FAIL);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        username,
        email,
        password: hashedPassword,
        role
    });

    const accessToken = generateAccessToken({email: newUser.email, id: newUser._id, role: newUser.role});
    const refreshToken = generateRefreshToken({email: newUser.email, id: newUser._id, role: newUser.role});
    
    await newUser.save();
    res.status(201).json({
        status: 'success',
        data: {
            accessToken,
            refreshToken
        }
    });
});

const login = asyncWrapper(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw AppError.create('Email and password are required', 400, httpStatus.FAIL);
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw AppError.create('User not found', 404, httpStatus.FAIL);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw AppError.create('Invalid credentials', 400, httpStatus.FAIL);
    }
    const accessToken = generateAccessToken({email: user.email, id: user._id, role: user.role});
    const refreshToken = generateRefreshToken({email: user.email, id: user._id, role: user.role});
    
    res.json({ 
        status: 'success', 
        data: { accessToken, refreshToken } 
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
        const accessToken = generateAccessToken({email: user.email, id: user._id, role: user.role});
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

module.exports = {
    getAllUsers,
    register,
    login,
    refreshToken,
    getMe
};

