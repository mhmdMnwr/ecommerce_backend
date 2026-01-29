const User = require('../models/user.model');
const httpStatus = require('../constants/httpStatusText.js');
const AppError = require('../constants/appErrors.js');
const bcrypt = require('bcryptjs');
const asyncWrapper = require('../middleware/asyncWrapper');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateJWT');
const jwt = require('jsonwebtoken');
const { Roles  } = require('../constants/roles.js');


const getAllUsers = asyncWrapper(async (req, res, next) => {
    const { limit = 10, page = 1, name, status , role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!role || ![Roles.CUSTOMER, Roles.MANAGER, Roles.ADMIN, Roles.SUPER_ADMIN].includes(role)) {
        return next ( AppError.create('Valid role query parameter is required', 400, httpStatus.FAIL));
    }
    const filter = { role: role }; 

    if (name) {
        filter.username = { $regex: name, $options: 'i' };
    }

    
    if (status) {
        filter.status = status;
    }

    const users = await User.find(filter)
        .select('-password -__v') 
        .sort({ createdAt: -1 })  
        .limit(parseInt(limit))
        .skip(skip);

    // 3. Get Total Count (for frontend pagination UI)
    const totalUsers = await User.countDocuments(filter);

    res.json({
        status: httpStatus.SUCCESS,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalUsers / limit)
        },
        data:  {users} 
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
    if (!user ) {
        return next(AppError.create('Invalid credentials', 401, httpStatus.FAIL));
    }

    // 3. Password Verification
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return next(AppError.create('Invalid credentials', 401, httpStatus.FAIL));
    }


    if (user.status !== 'active') {
        return next(AppError.create('Your account is inactive. Please contact support.', 403, httpStatus.FAIL));
    }


    // 4. Token Generation
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

    // 5. Response Construction
    const responseData = {
        accessToken,
        refreshToken,
        
    };

    

    res.status(200).json({
        status: 'success',
        data: { responseData }
    });
});

const refreshToken = asyncWrapper(async (req, res, next) => {
    const { token } = req.body;
    if (!token) {
        return next ( AppError.create('Token is required', 401, httpStatus.FAIL));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return next ( AppError.create('User not found', 404, httpStatus.FAIL));
        }
        if(user.status !== 'active'){
            return next ( AppError.create('User account is inactive', 403, httpStatus.FAIL));
        }
        const accessToken = generateAccessToken({ id: user._id, role: user.role });
        res.json({ status: httpStatus.SUCCESS, data: { accessToken } });
    } catch (err) {
        return next ( AppError.create('Invalid refresh token', 401, httpStatus.FAIL));
    }
});

const getMe = asyncWrapper(async (req, res, next) => {
    const user = await User.findById(req.currentUser.id).select('-password');
    
    if (!user) return next(AppError.create('User no longer exists', 404));

    res.json({
        status: httpStatus.SUCCESS,
        data: { user }
    });
});

const registerCustomer = asyncWrapper(async (req, res, next) => {
    const { username, password,role , address, phone } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        username,
        password: hashedPassword,
        address,
        phone,
        role: Roles.CUSTOMER 
    });

    await newUser.save();
    res.status(201).json({ status: httpStatus.SUCCESS, data: { user: newUser } });
});

const createManagerByAdmin = asyncWrapper(async (req, res, next) => {
    const { username, password, address , phone } = req.body;


    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
        username: username,
        password: hashedPassword,
        role:  Roles.MANAGER,
        address: address ,
        phone: phone
    });

    await newAdmin.save();
    res.status(201).json({ status: httpStatus.SUCCESS, data: { user: newAdmin } });
});




const toggleUserStatus = asyncWrapper(async (req, res, next) => {
    const { userId } = req.params;

    // 1. Find the user
    const user = await User.findById(userId);

    if (!user) {
        return next(AppError.create('User not found', 404, httpStatus.FAIL));
    }

    // 2. Prevent the SuperAdmin from deactivating themselves by accident!
    if (userId === req.currentUser.id.toString()) {
        return next(AppError.create("You cannot deactivate your own admin account.", 400, httpStatus.FAIL));
    }

    // 3. Flip the status
    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    // 4. Send back the result
    res.status(200).json({
        status: httpStatus.SUCCESS,
        message: `User is now ${user.status}`,
        data: {
            userId: user._id,
            newStatus: user.status
        }
    });
});



module.exports = {
    getAllUsers,
    registerCustomer,
    createManagerByAdmin,
    login,
    refreshToken,
    getMe,
    toggleUserStatus
};

