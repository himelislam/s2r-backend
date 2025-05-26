const mongoose = require("mongoose");
const { mongo: { uri } } = require("./env");
const StripeService = require('../service/stripeService');


const connectToDatabase = async () => {
  try {
    const db = await mongoose.connect(uri, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    })
    console.log(`MongoDB Connected: ${db.connection.host}`);

    await StripeService.initializePlans();
    console.log('Stripe plans initialized successfully');

    // process.exit(0);
  } catch (error) {
    console.error(`${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectToDatabase };