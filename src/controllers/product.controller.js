const Product = require('../models/product.model');
const Brand = require('../models/brand.model');
const Category = require('../models/category.model');
const Order = require('../models/order.model');
const mongoose = require('mongoose');
const httpStatus = require('../constants/httpStatusText');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get all products with filtering, sorting, and pagination
const getAllProducts = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = {};

    // 1. Text Search
    if (query.title) {
        filter.title = { $regex: query.title, $options: 'i' };
    }

    // 2. Filter by Brand Name (Searching for ID based on Title)
    if (query.brand) {
        const brand = await Brand.findOne({ 
            title: { $regex: query.brand, $options: 'i' } 
        });
        filter.brand = brand ? brand._id : new mongoose.Types.ObjectId();
    }

    // 3. Filter by Category Name
    if (query.category) {
        const category = await Category.findOne({ 
            title: { $regex: query.category, $options: 'i' } 
        });
        filter.category = category ? category._id : new mongoose.Types.ObjectId();
    }

    if (query.state) {
        filter.state = query.state;
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
        .populate('category', 'title image')
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
        .populate('category', 'title');

    if (!product) {
        return next(AppError.create('Product not found', 404, httpStatus.FAIL));
    }

    res.status(200).json(
        new ApiResponse(200, "Product details fetched", product)
    );
});

// @desc    Create new product
const createProduct = asyncWrapper(async (req, res, next) => {
    const { title, price, image, state, brandID, categoryID, units_num } = req.body;
    
    if (!title || !price || !units_num) {
        return next(AppError.create('title, price and units_num are required', 400, httpStatus.FAIL));
    }

    const newProduct = new Product({
        title,
        price,
        image,
        state,
        category: categoryID,
        brand: brandID,
        units_num
    });

    await newProduct.save();

    res.status(201).json(
        new ApiResponse(201, "Product created successfully", newProduct)
    );
});

// @desc    Update product
const updateProduct = asyncWrapper(async (req, res, next) => {
    const product = await Product.findByIdAndUpdate(
        req.params.id, 
        { $set: req.body }, 
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

module.exports = {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
};