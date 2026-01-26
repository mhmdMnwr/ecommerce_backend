const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
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
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Product', productSchema);
