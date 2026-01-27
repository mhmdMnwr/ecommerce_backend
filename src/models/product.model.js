const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    brand: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: ''
    },
    units_num: {
        type: Number,
        required: true
    },
    state: {
        type: String,
        enum: ['available', 'not available'],
        default: 'available'
    },

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
