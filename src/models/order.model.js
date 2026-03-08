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
    }],
    comment: { type: String, 
        default: '' },
    totalAmount: { type: Number, 
        required: true, 
        min: 0 },
    status: { type: String, 
        enum: StatusValues , 
        default: OrderStatus.PENDING },

}, { timestamps: true });



module.exports = mongoose.model('Order', orderSchema);