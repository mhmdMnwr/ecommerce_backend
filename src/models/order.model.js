const mongoose = require('mongoose');
const { StatusValues , OrderStatus} = require('../constants/orderStatus');

const orderSchema = new mongoose.Schema({
    customerId: {
         type: mongoose.Schema.Types.ObjectId, 
         ref: 'User', 
         required: true 
        },
    items: [{
        _id: false,
        productId: { type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product', 
            required: true 
        },
        quantity: { type: Number, 
            required: true, 
            min: 1, },
        units: { type: Number, 
            required: true, 
            min: 1 },
        price: { type: Number, 
            required: true, 
            min: 0 },
        title: { type: String, default: '' },
        image: { type: String, default: '' },
    }],
    comment: { type: String, 
        default: '' },
    totalAmount: { type: Number, 
        required: true, 
        min: 0 },
    status: { type: String, 
        enum: StatusValues , 
        default: OrderStatus.PENDING },
    deliveredAt: { type: Date, default: null },

}, { 
    timestamps: true,
    toJSON: {
        transform(doc, ret) {
            if (ret.totalAmount != null) ret.totalAmount = parseFloat(ret.totalAmount.toFixed(2));
            if (ret.items && Array.isArray(ret.items)) {
                ret.items = ret.items.map(item => {
                    if (item.price != null) item.price = parseFloat(item.price.toFixed(2));
                    return item;
                });
            }
            return ret;
        }
    },
    toObject: {
        transform(doc, ret) {
            if (ret.totalAmount != null) ret.totalAmount = parseFloat(ret.totalAmount.toFixed(2));
            if (ret.items && Array.isArray(ret.items)) {
                ret.items = ret.items.map(item => {
                    if (item.price != null) item.price = parseFloat(item.price.toFixed(2));
                    return item;
                });
            }
            return ret;
        }
    }
});



module.exports = mongoose.model('Order', orderSchema);