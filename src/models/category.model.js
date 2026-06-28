const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    translation: {
        en: { type: String },
        fr: { type: String },
        ar: { type: String }
    },
    image: {
        type: String,
        default: ''
    },

}, { timestamps: true });

// Backward compatibility for clients expecting 'title'
categorySchema.virtual('title').get(function () {
    if (this.translation) {
        return this.translation.en || this.translation.fr || this.translation.ar || '';
    }
    return '';
});

categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

categorySchema.pre('validate', function () {
    if (!this.translation || (!this.translation.en && !this.translation.fr && !this.translation.ar)) {
        this.invalidate('translation', 'At least one translation (en, fr, ar) must be provided.');
    }
});

const Category = mongoose.model('Category', categorySchema);
Category.syncIndexes().catch(console.error);

module.exports = Category;
