const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
    
    customer: {
        type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              default: null,

    },
    comment: {
        type: String,
        required: true
    },



}, { timestamps: true })

module.exports = mongoose.model('Feedback', feedbackSchema);