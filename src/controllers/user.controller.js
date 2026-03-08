const User = require('../models/user.model');
const httpStatus = require('../constants/httpStatusText.js');
const AppError = require('../utils/appErrors.js');
const bcrypt = require('bcryptjs');
const asyncWrapper = require('../middleware/asyncWrapper');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateJWT');
const jwt = require('jsonwebtoken');
const { Roles } = require('../constants/roles.js');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get all users filtered by role/name (Admin/SuperAdmin)
const getAllUsers = asyncWrapper(async (req, res, next) => {
    const { limit = 10, page = 1, name, status, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!role || ![Roles.CUSTOMER, Roles.MANAGER, Roles.ADMIN, Roles.SUPER_ADMIN].includes(role)) {
        return next(AppError.create('Valid role query parameter is required', 400, httpStatus.FAIL));
    }
    
    const filter = { role: role };
    if (name) filter.username = { $regex: name, $options: 'i' };
    if (status) filter.status = status;

    const users = await User.find(filter)
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

    const totalUsers = await User.countDocuments(filter);

    const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalUsers / limit),
        totalItems: totalUsers
    };

    res.status(200).json(
        new ApiResponse(200, "Users fetched successfully", users, pagination)
    );
});

// @desc    User Login
const login = asyncWrapper(async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return next(AppError.create('Username and password are required', 400, httpStatus.FAIL));
    }

    const user = await User.findOne({ username });
    if (!user) {
        return next(AppError.create('Invalid credentials', 401, httpStatus.FAIL));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return next(AppError.create('Invalid credentials', 401, httpStatus.FAIL));
    }

    if (user.status !== 'active') {
        return next(AppError.create('Your account is inactive. Please contact support.', 403, httpStatus.FAIL));
    }

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

    res.status(200).json(
        new ApiResponse(200, "Login successful", { accessToken, refreshToken })
    );
});

// @desc    Renew Access Token using Refresh Token
const refreshToken = asyncWrapper(async (req, res, next) => {
    const { token } = req.body;
    if (!token) return next(AppError.create('Token is required', 401, httpStatus.FAIL));

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) return next(AppError.create('User not found', 404, httpStatus.FAIL));
        if (user.status !== 'active') return next(AppError.create('User account is inactive', 403, httpStatus.FAIL));

        const accessToken = generateAccessToken({ id: user._id, role: user.role });
        
        res.status(200).json(
            new ApiResponse(200, "Token refreshed", { accessToken })
        );
    } catch (err) {
        return next(AppError.create('Invalid refresh token', 401, httpStatus.FAIL));
    }
});

// @desc    Get profile of current logged-in user
const getMe = asyncWrapper(async (req, res, next) => {
    const user = await User.findById(req.currentUser.id).select('-password');
    if (!user) return next(AppError.create('User no longer exists', 404));

    res.status(200).json(
        new ApiResponse(200, "User profile fetched", user)
    );
});

// @desc    Public Registration
const registerCustomer = asyncWrapper(async (req, res, next) => {
    const { username, password, address, phone } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        username,
        password: hashedPassword,
        address,
        phone,
        role: Roles.CUSTOMER
    });

    await newUser.save();
    
    // Remove password from object before sending back
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json(
        new ApiResponse(201, "Registration successful", userResponse)
    );
});

// @desc    Admin: Create Manager Account
const createManagerByAdmin = asyncWrapper(async (req, res, next) => {
    const { username, password, address, phone } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newManager = new User({
        username,
        password: hashedPassword,
        role: Roles.MANAGER,
        address,
        phone
    });

    await newManager.save();
    
    const managerResponse = newManager.toObject();
    delete managerResponse.password;

    res.status(201).json(
        new ApiResponse(201, "Manager account created", managerResponse)
    );
});

// @desc    Customer: Update own profile
const updateMe = asyncWrapper(async (req, res, next) => {
    const userId = req.currentUser.id;
    
    // Prevent status update
    const { status, role, password, ...allowedUpdates } = req.body;
    
    if (Object.keys(allowedUpdates).length === 0) {
        return next(AppError.create('No valid fields to update', 400, httpStatus.FAIL));
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: allowedUpdates },
        { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedUser) {
        return next(AppError.create('User not found', 404, httpStatus.FAIL));
    }

    res.status(200).json(
        new ApiResponse(200, "Profile updated successfully", updatedUser)
    );
});

// @desc    Admin: Update Manager by ID
const updateManagerById = asyncWrapper(async (req, res, next) => {
    const { managerId } = req.params;
    
    // Prevent status and role update
    const { status, role, password, ...allowedUpdates } = req.body;
    
    if (Object.keys(allowedUpdates).length === 0) {
        return next(AppError.create('No valid fields to update', 400, httpStatus.FAIL));
    }

    const manager = await User.findById(managerId);
    
    if (!manager) {
        return next(AppError.create('Manager not found', 404, httpStatus.FAIL));
    }

    if (manager.role !== Roles.MANAGER) {
        return next(AppError.create('User is not a manager', 400, httpStatus.FAIL));
    }

    const updatedManager = await User.findByIdAndUpdate(
        managerId,
        { $set: allowedUpdates },
        { new: true, runValidators: true }
    ).select('-password -__v');

    res.status(200).json(
        new ApiResponse(200, "Manager updated successfully", updatedManager)
    );
});

// @desc    Toggle User Active/Inactive Status
const toggleUserStatus = asyncWrapper(async (req, res, next) => {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) return next(AppError.create('User not found', 404, httpStatus.FAIL));

    if (userId === req.currentUser.id.toString()) {
        return next(AppError.create("You cannot deactivate your own account.", 400, httpStatus.FAIL));
    }

    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    res.status(200).json(
        new ApiResponse(200, `User is now ${user.status}`, {
            userId: user._id,
            newStatus: user.status
        })
    );
});

module.exports = {
    getAllUsers,
    registerCustomer,
    createManagerByAdmin,
    login,
    refreshToken,
    getMe,
    updateMe,
    updateManagerById,
    toggleUserStatus
};