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
        if (!product) throw new Error(`Product ${item.productId} not found`);

        // PRICE LOGIC: Use provided price if Admin, else use DB Price
        const price = (isAdmin && item.price !== undefined) ? item.price : product.price;
        
        calculatedTotal += price * item.quantity;
        
        return {
            productId: product._id,
            title: product.title,
            price: price,
            quantity: item.quantity
        };
    });

    return {
        finalItems,
        totalAmount: Math.round(calculatedTotal * 100) / 100
    };
};