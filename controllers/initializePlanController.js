const expressAsyncHandler = require('express-async-handler');
const Config = require('../models/configModel');
const StripeService = require('../service/stripeService');
const { ApiError } = require('../utils/ApiError');
const { ensureConnection } = require('../config/db');

const initializePlans = expressAsyncHandler(async (req, res) => {

    await ensureConnection();
  // Check if already initialized (atomic operation)
  const config = await Config.findOneAndUpdate(
    { key: 'stripe_initialized' },
    { $setOnInsert: { key: 'stripe_initialized', value: true } },
    { 
      upsert: true, 
      new: true, 
      runValidators: true,
      session: await mongoose.startSession() // Add transaction support
    }
  );

  if (!config.isNew) {
    throw new ApiError(400, 'Stripe plans already initialized');
  }

  // Initialize plans
  await StripeService.initializePlans();

  res.status(200).json({
    success: true,
    message: 'Stripe plans initialized successfully'
  });
});

module.exports = {
    initializePlans
};