const Product = require('../models/product.model');
const ProductStatus = require('../constants/productStatus');
/**
 * DRY Helper: Validates products and calculates totals
 * @param {Array} items - The items from req.body
 * @param {Boolean} isAdmin - Whether to allow price overrides
 */
const validateAndCalculateOrder = async (items, isAdmin = false) => {
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));

    let calculatedTotal = 0;
    const finalItems = items.map(item => {
        const product = productMap[item.productId];
        
        if (!product) throw  new Error(`Product ${item.productId} not found`);

        // --- CHECK THE STATE INSTEAD OF QUANTITY ---
        if (product.state === ProductStatus.UNAVAILABLE) {
            throw new Error(`Product "${product.title}" is currently not available.`);
        }

        const price = (isAdmin && item.price !== undefined) ? item.price : product.price;
        calculatedTotal += price * item.quantity;
        
        return {
            productId: product._id,
            title: product.title,
            price: price,
            units: product.units,
            quantity: item.quantity
        };
    });

    return {
        finalItems,
        totalAmount: Math.round(calculatedTotal * 100) / 100
    };
};

module.exports = {
    validateAndCalculateOrder
};