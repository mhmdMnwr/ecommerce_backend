const User = require('../models/user.model');
const httpStatus = require('../constants/httpStatusText.js');
const AppError = require('../utils/appErrors.js');
const bcrypt = require('bcryptjs');
const asyncWrapper = require('../middleware/asyncWrapper');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateJWT');
const jwt = require('jsonwebtoken');
const { Roles } = require('../constants/roles.js');
const { UserStatus } = require('../constants/userStatus.js');
const ApiResponse = require('../utils/apiResponse');
const { escapeRegex } = require('../utils/sanitize');
const { validateUsername, validatePassword, validatePhone, validateAddress, validateLatitude, validateLongitude, safePaginationLimit } = require('../utils/validators');

// @desc    Get all users filtered by role/name (Admin/SuperAdmin)
const getAllUsers = asyncWrapper(async (req, res, next) => {
    const { page = 1, name, status, role } = req.query;
    const limit = safePaginationLimit(req.query.limit);
    const skip = (parseInt(page) - 1) * limit;

    if (!role || ![Roles.CUSTOMER, Roles.MANAGER, Roles.ADMIN, Roles.SUPER_ADMIN].includes(role)) {
        return next(AppError.create('Valid role query parameter is required', 400, httpStatus.FAIL));
    }

    const filter = { role: role };
    if (name) filter.username = { $regex: escapeRegex(name), $options: 'i' };
    if (status) filter.status = status;

    const users = await User.find(filter)
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

    const totalUsers = await User.countDocuments(filter);

    const pagination = {
        page: parseInt(page),
        limit: limit,
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

    // Inactive customers get tokens but a special status flag
    // so the app can cache the session and show the pending-approval screen.
    if (user.status !== 'active') {
        const accessToken = generateAccessToken({ id: user._id, role: user.role, tokenVersion: user.tokenVersion });
        const refreshToken = generateRefreshToken({ id: user._id, role: user.role, tokenVersion: user.tokenVersion });

        return res.status(200).json(
            new ApiResponse(200, "Account is pending approval", {
                accessToken,
                refreshToken,
                status: user.status
            })
        );
    }

    const accessToken = generateAccessToken({ id: user._id, role: user.role, tokenVersion: user.tokenVersion });
    const refreshToken = generateRefreshToken({ id: user._id, role: user.role, tokenVersion: user.tokenVersion });

    res.status(200).json(
        new ApiResponse(200, "Login successful", {
            accessToken,
            refreshToken,
            status: user.status
        })
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

        if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
            return next(AppError.create('Invalid refresh token', 401, httpStatus.FAIL));
        }

        const accessToken = generateAccessToken({ id: user._id, role: user.role, tokenVersion: user.tokenVersion });

        if (user.status !== 'active') {
            return res.status(200).json(
                new ApiResponse(200, "Token refreshed", { accessToken, status: user.status })
            );
        }

        res.status(200).json(
            new ApiResponse(200, "Token refreshed", { accessToken, status: user.status })
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
    const { username, password, address, phone, latitude, longitude } = req.body;

    // ── Input Validation (V2 + V7) ──────────────────
    const sanitizedUsername = validateUsername(username);
    validatePassword(password);
    validatePhone(phone);
    validateAddress(address);
    validateLatitude(latitude);
    validateLongitude(longitude);

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
        username: sanitizedUsername,
        password: hashedPassword,
        address,
        phone,
        latitude: latitude || null,
        longitude: longitude || null,
        role: Roles.CUSTOMER,
        status: UserStatus.INACTIVE   // Customers start inactive until admin approves
    });

    await newUser.save();

    // Generate tokens so the app can cache the session
    const accessToken = generateAccessToken({ id: newUser._id, role: newUser.role, tokenVersion: newUser.tokenVersion });
    const refreshToken = generateRefreshToken({ id: newUser._id, role: newUser.role, tokenVersion: newUser.tokenVersion });

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json(
        new ApiResponse(201, "Registration successful", {
            accessToken,
            refreshToken,
            user: userResponse,
            status: newUser.status
        })
    );
});

// @desc    Admin: Create Manager Account
const createManagerByAdmin = asyncWrapper(async (req, res, next) => {
    const { username, password, address, phone } = req.body;

    // ── Input Validation ────────────────────────────
    const sanitizedUsername = validateUsername(username);
    validatePassword(password);
    validatePhone(phone);
    validateAddress(address);

    const hashedPassword = await bcrypt.hash(password, 12);
    const newManager = new User({
        username: sanitizedUsername,
        password: hashedPassword,
        role: Roles.MANAGER,
        status: UserStatus.ACTIVE,
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

    // V11: Whitelist only safe fields for self-update
    const ALLOWED_FIELDS = ['username', 'address', 'phone', 'latitude', 'longitude'];
    const allowedUpdates = {};
    for (const field of ALLOWED_FIELDS) {
        if (req.body[field] !== undefined) {
            allowedUpdates[field] = req.body[field];
        }
    }

    if (Object.keys(allowedUpdates).length === 0) {
        return next(AppError.create('No valid fields to update', 400, httpStatus.FAIL));
    }

    // Validate provided fields
    if (allowedUpdates.username) allowedUpdates.username = validateUsername(allowedUpdates.username);
    if (allowedUpdates.phone) validatePhone(allowedUpdates.phone);
    if (allowedUpdates.address) validateAddress(allowedUpdates.address);
    if (allowedUpdates.latitude !== undefined) validateLatitude(allowedUpdates.latitude);
    if (allowedUpdates.longitude !== undefined) validateLongitude(allowedUpdates.longitude);

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

    // Whitelist safe fields for manager updates
    const ALLOWED_FIELDS = ['username', 'address', 'phone'];
    const allowedUpdates = {};
    for (const field of ALLOWED_FIELDS) {
        if (req.body[field] !== undefined) {
            allowedUpdates[field] = req.body[field];
        }
    }

    if (Object.keys(allowedUpdates).length === 0) {
        return next(AppError.create('No valid fields to update', 400, httpStatus.FAIL));
    }

    // Validate provided fields
    if (allowedUpdates.username) allowedUpdates.username = validateUsername(allowedUpdates.username);
    if (allowedUpdates.phone) validatePhone(allowedUpdates.phone);
    if (allowedUpdates.address) validateAddress(allowedUpdates.address);

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

    if (user.status === 'active') {
        user.status = 'inactive';
        user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate existing tokens
    } else {
        user.status = 'active';
        // Do not increment tokenVersion when activating, so they can enter the app without re-logging in
    }
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