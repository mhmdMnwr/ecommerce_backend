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
        required: true 
    },
    brand: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    state: { 
        type: String, 
        enum: ['available', 'not available'], 
        default: 'available' 
    }
});

module.exports = mongoose.model('Product', productSchema);
