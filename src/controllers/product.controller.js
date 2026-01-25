const Product = require('../models/product.model');
const httpStatus = require('../utils/httpStatusText');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');

const getAllProducts = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.name) {
        filter.name = { $regex: query.name, $options: 'i' }; // Case-insensitive partial match
    }

    const products = await Product.find(filter,{"__v":false}).limit(limit).skip(skip);
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            products
        }
    });
});

const getProduct = asyncWrapper(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        throw AppError.create('Product not found', 404, httpStatus.FAIL);
    }
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            product
        }
    });
});

const createProduct = asyncWrapper(async (req, res) => {
    const { name, price, image, state, brand, category } = req.body;
    if (!name || !price || !image || !brand || !category) {
        throw AppError.create('Name, price, image, brand and category are required', 400, httpStatus.FAIL);
    }
    const newProduct = new Product({
        name,
        price,
        image,
        state,
        brand,
        category
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
    const updatedProduct = await Product.updateOne({_id: productId}, {$set: {...req.body}});
    if (updatedProduct.matchedCount === 0) {
        throw AppError.create('Product not found', 404, httpStatus.FAIL);
    }
    const product = await Product.findById(productId);
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            product
        }
    });
});

const deleteProduct = asyncWrapper(async (req, res) => { 
    const result = await Product.deleteOne({_id: req.params.id});
    if (result.deletedCount === 0) {
        throw AppError.create('Product not found', 404, httpStatus.FAIL);
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
