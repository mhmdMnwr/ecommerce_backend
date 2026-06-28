const Product = require('../models/product.model');
const Brand = require('../models/brand.model');
const Category = require('../models/category.model');
const Order = require('../models/order.model');
const mongoose = require('mongoose');
const httpStatus = require('../constants/httpStatusText');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');
const ApiResponse = require('../utils/apiResponse');
const { escapeRegex } = require('../utils/sanitize');
const { safePaginationLimit } = require('../utils/validators');

// @desc    Get all products with filtering, sorting, and pagination
const getAllProducts = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = safePaginationLimit(query.limit);
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = {};

    // 0. Customers only see available products
    if (req.currentUser.role === 'customer') {
        filter.state = 'available';
    }

    // 1. Text Search
    if (query.title) {
        filter.title = { $regex: escapeRegex(query.title), $options: 'i' };
    }

    // 2. Filter by Brand Name (Searching for ID based on Title)
    if (query.brand) {
        const brand = await Brand.findOne({
            title: { $regex: escapeRegex(query.brand), $options: 'i' }
        });
        filter.brand = brand ? brand._id : new mongoose.Types.ObjectId();
    }

    // 3. Filter by Category Name
    if (query.category) {
        const category = await Category.findOne({
            title: { $regex: escapeRegex(query.category), $options: 'i' }
        });
        filter.category = category ? category._id : new mongoose.Types.ObjectId();
    }

    if (query.state) {
        filter.state = query.state;
    }

    // 5. Price range filter
    if (query.minPrice || query.maxPrice) {
        filter.price = {};
        if (query.minPrice) filter.price.$gte = parseFloat(query.minPrice);
        if (query.maxPrice) filter.price.$lte = parseFloat(query.maxPrice);
    }

    // 6. Filter by Category ID directly (for mobile app)
    if (query.categoryId) {
        filter.category = new mongoose.Types.ObjectId(query.categoryId);
    }

    // 4. Sorting Logic
    let sortOption = {};
    if (query.sort) {
        const sortField = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
        const sortOrder = query.sort.startsWith('-') ? -1 : 1;
        sortOption[sortField] = sortOrder;
    }

    const total = await Product.countDocuments(filter);

    let productsQuery = Product.find(filter, { "__v": false })
        .populate('brand', 'title image')
        .populate('category', 'translation image')
        .limit(limit)
        .skip(skip);

    if (Object.keys(sortOption).length > 0) {
        productsQuery = productsQuery.sort(sortOption).collation({ locale: 'en', strength: 2 });
    }

    const products = await productsQuery;

    const pagination = {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total
    };

    res.status(200).json(
        new ApiResponse(200, "Products fetched successfully", products, pagination)
    );
});

// @desc    Get single product
const getProduct = asyncWrapper(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
        .populate('brand', 'title')
        .populate('category', 'translation image');

    if (!product) {
        return next(AppError.create('Product not found', 404, httpStatus.FAIL));
    }

    if (req.currentUser.role === 'customer' && product.state !== 'available') {
        return next(AppError.create('Product is currently unavailable', 403, httpStatus.FAIL));
    }

    res.status(200).json(
        new ApiResponse(200, "Product details fetched", product)
    );
});

// @desc    Create new product
const createProduct = asyncWrapper(async (req, res, next) => {
    const { title, price, image, state, brandID, categoryID, units } = req.body;

    if (!title || !price || !units) {
        return next(AppError.create('title, price and units are required', 400, httpStatus.FAIL));
    }

    const newProduct = new Product({
        title: title,
        price: price,
        image: image,
        state: state,
        category: categoryID,
        brand: brandID,
        units: units
    });

    await newProduct.save();

    res.status(201).json(
        new ApiResponse(201, "Product created successfully", newProduct)
    );
});

// @desc    Update product
const updateProduct = asyncWrapper(async (req, res, next) => {
    // V3: Whitelist allowed fields to prevent mass assignment
    const ALLOWED_FIELDS = ['title', 'price', 'image', 'state', 'category', 'brand', 'units'];
    const updates = {};
    for (const field of ALLOWED_FIELDS) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }
    // Also accept brandID/categoryID aliases from frontend
    if (req.body.brandID !== undefined) updates.brand = req.body.brandID;
    if (req.body.categoryID !== undefined) updates.category = req.body.categoryID;

    if (Object.keys(updates).length === 0) {
        return next(AppError.create('No valid fields to update', 400, httpStatus.FAIL));
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
    );

    if (!product) {
        return next(AppError.create('Product not found', 404, httpStatus.FAIL));
    }

    res.status(200).json(
        new ApiResponse(200, "Product updated successfully", product)
    );
});

// @desc    Delete product (Safety check for existing orders)
const deleteProduct = asyncWrapper(async (req, res, next) => {
    // Check if any order contains this product to prevent data orphaned links
    const existingOrder = await Order.findOne({ 'items.productId': req.params.id });

    if (existingOrder) {
        return next(AppError.create('Cannot delete product: it exists in an order record', 400, httpStatus.FAIL));
    }

    const result = await Product.deleteOne({ _id: req.params.id });

    if (result.deletedCount === 0) {
        return next(AppError.create('Product not found', 404, httpStatus.FAIL));
    }

    res.status(200).json(
        new ApiResponse(200, "Product deleted successfully", null)
    );
});

const getNewProducts = asyncWrapper(async (req, res, next) => {
    const query = req.query || {};
    const limit = safePaginationLimit(query.limit);
    const filter = req.currentUser.role === 'customer' ? { state: 'available' } : {};
    const products = await Product.find(filter)
        .populate('brand', 'title image')
        .populate('category', 'translation image')
        .sort({ createdAt: -1 })
        .limit(limit);
    res.status(200).json(
        new ApiResponse(200, "New products fetched successfully", products)
    );
});

const getTopSellingProducts = asyncWrapper(async (req, res, next) => {
    const query = req.query || {};
    const limit = safePaginationLimit(query.limit);
    const filter = req.currentUser.role === 'customer' ? { state: 'available' } : {};
    const products = await Product.find(filter)
        .populate('brand', 'title image')
        .populate('category', 'translation image')
        .sort({ totalSold: -1 })
        .limit(limit);
    res.status(200).json(
        new ApiResponse(200, "Top selling products fetched successfully", products)
    );
});

module.exports = {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getNewProducts,
    getTopSellingProducts
};