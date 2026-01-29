const Product = require('../models/product.model');
const httpStatus = require('../constants/httpStatusText');
const AppError = require('../constants/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');
const Brand = require('../models/brand.model');
const Category = require('../models/category.model');
const mongoose = require('mongoose');

const getAllProducts = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = {};

    if (query.title) {
        filter.title = { $regex: query.title, $options: 'i' };
    }

    if (query.brand) {
        const brand = await mongoose.model('Brand').findOne({ 
            title: { $regex: query.brand, $options: 'i' } 
        });
        filter.brand = brand ? brand._id : new mongoose.Types.ObjectId();
    }

    if (query.category) {
        const category = await mongoose.model('Category').findOne({ 
            title: { $regex: query.category, $options: 'i' } 
        });
        filter.category = category ? category._id : new mongoose.Types.ObjectId();
    }

   
    if (query.state) {
        filter.state = query.state;
    }

    
    let sortOption = {};
    if (query.sort) {
        const sortField = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
        const sortOrder = query.sort.startsWith('-') ? -1 : 1;
        sortOption[sortField] = sortOrder;
    }

    const total = await Product.countDocuments(filter);

    
    let productsQuery = Product.find(filter, { "__v": false })
        .populate('brand', 'title image')    // Fetch Brand details
        .populate('category', 'title image')       // Fetch Category details
        .limit(limit)
        .skip(skip);

    if (Object.keys(sortOption).length > 0) {
        productsQuery = productsQuery.sort(sortOption).collation({ locale: 'en', strength: 2 });
    }

    const products = await productsQuery;

    res.json({
        status: httpStatus.SUCCESS,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        data:  {products} 
    });
});

const getProduct = asyncWrapper(async (req, res) => {
    const product = await Product.findById(req.params.id)
    if (!product) {
        return next ( AppError.create('Product not found', 404, httpStatus.FAIL));
    }
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            product
        }
    });
});

const createProduct = asyncWrapper(async (req, res) => {
    const { title, price, image, state, brandID, categoryID, units_num } = req.body;
    if (!title || !price || !units_num) {
        return next ( AppError.create('title, price and units_num are required', 400, httpStatus.FAIL));
    }
    const newProduct = new Product({
        title,
        price,
        image,
        state,
        category : categoryID,
        brand: brandID,
        units_num
    });
    await newProduct.save();
    res.status(201).json({
        status: httpStatus.SUCCESS,
        data: {
            product: newProduct
        }
    });
});

const updateProduct = asyncWrapper(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findByIdAndUpdate(
        productId, 
        { $set: req.body }, 
        { new: true, runValidators: true }
    );

    if (!product) {
        return next ( AppError.create('Product not found', 404, httpStatus.FAIL));
    }

    res.json({
        status: httpStatus.SUCCESS,
        data: { product }
    });
});

const deleteProduct = asyncWrapper(async (req, res) => { 
    const result = await Product.deleteOne({_id: req.params.id});
    if (result.deletedCount === 0) {
        return next ( AppError.create('Product not found', 404, httpStatus.FAIL));
    }
    res.json({
        status: httpStatus.SUCCESS,
        data: null
    });
});

module.exports = {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
};
