const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        unique: true
    },
    image: { 
        type: String, 
        default: ''
    }
});

module.exports = mongoose.model('Category', categorySchema);
