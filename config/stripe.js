const { stripe: { api_secret } } = require("./env");
const stripe = require('stripe')(api_secret);

// Initialize Stripe with your secret key
module.exports = stripe;