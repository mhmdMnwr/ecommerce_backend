const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
    username : {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
        
    },
    comment : {
        type: String,
        required: true
    },
    createdAt: { 
        
        type: Date, default: Date.now }


})

module.exports = mongoose.model('Feedback', feedbackSchema);