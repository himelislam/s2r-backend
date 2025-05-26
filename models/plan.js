const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['starter', 'premium']
  },
  type: {
    type: String,
    required: true,
    enum: ['monthly', 'yearly', 'lifetime']
  },
  price: {
    type: Number,
    required: true
  },
  stripePriceId: {
    type: String,
    required: true
  },
  features: {
    type: [String],
    default: []
  },
  limits: {
    qrCodes: Number,
    referrers: Number,
    campaigns: Number,
    payouts: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Plan', planSchema);