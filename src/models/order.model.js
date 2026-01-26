const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        _id: false,
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        title: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        units: { type: Number, required: true, min: 0 },
        price:{ type: Number, required: true, min: 0 }
    }],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'processing', 'delivered','shipped' ,  'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});



module.exports = mongoose.model('Order', orderSchema);