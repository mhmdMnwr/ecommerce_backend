
const mongoose = require('mongoose');
const { StatusValues , ProductStatus } = require('../constants/productStatus');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      unique: true,
      required: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    image: {
      type: String,
      default: ''
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      validate: {
        validator: async function (value) {
          if (!value) return true; // allow empty
          const category = await mongoose.model('Category').findById(value);
          return !!category;
        },
        message: 'Category does not exist'
      }
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
      validate: {
        validator: async function (value) {
          if (!value) return true; // allow empty
          const brand = await mongoose.model('Brand').findById(value);
          return !!brand;
        },
        message: 'Brand does not exist'
      }
    },

    units: {
      type: Number,
      required: true,
      min: 1
    },

    totalSold: {
      type: Number,
      min: 0,
      default: 0
    },

    totalRevenue: {
      type: Number,
      min: 0,
      default: 0
    },

    state: {
      type: String,
      enum: StatusValues,
      default: ProductStatus.AVAILABLE
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
