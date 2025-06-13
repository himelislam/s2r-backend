const asyncHandler = require('express-async-handler');
const Member = require('../models/memberModel');
const StripeService = require('../service/stripeService');
const { default: mongoose } = require('mongoose');

const getHealth = asyncHandler(async (req, res) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    let stripeStatus = 'unknown';

    try {
        const plans = await StripeService.getAllPlans(); // or a lightweight call
        stripeStatus = Array.isArray(plans) ? 'connected' : 'error';
    } catch (err) {
        stripeStatus = 'error';
    }

    res.status(200).json({
        status: 'ok',
        mongoDB: mongoStatus,
        stripe: stripeStatus,
        timestamp: new Date().toISOString()
    });
})

module.exports = {
    getHealth
};