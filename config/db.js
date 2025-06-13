// const mongoose = require("mongoose");
// const { mongo: { uri } } = require("./env");
// const StripeService = require('../service/stripeService');


// const connectToDatabase = async () => {
//   try {
//     const db = await mongoose.connect(uri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 5000
//     })
//     console.log(`MongoDB Connected: ${db.connection.host}`);

//     await StripeService.initializePlans();
//     console.log('Stripe plans initialized successfully');

//     // process.exit(0);
//   } catch (error) {
//     console.error(`${error.message}`);
//     process.exit(1);
//   }
// };

// module.exports = { connectToDatabase };


const mongoose = require("mongoose");
const { mongo: { uri } } = require("./env");
const StripeService = require('../service/stripeService');
const Config = require('../models/configModel');

// const connectToDatabase = async () => {
//   try {
//     const db = await mongoose.connect(uri, {
//       // useNewUrlParser: true,
//       // useUnifiedTopology: true,
//       // serverSelectionTimeoutMS: 5000,
//     });
//     console.log(`MongoDB Connected: ${db.connection.host}`);

//     // const initialized = await Config.findOne({ key: 'stripe_initialized' });

//     // if (!initialized) {
//     //   await StripeService.initializePlans();
//     //   console.log('Stripe plans initialized successfully');

//     //   await Config.create({ key: 'stripe_initialized', value: true });
//     // } else {
//     //   console.log('Stripe plans already initialized, skipping...');
//     // }

//   } catch (error) {
//     console.error(`Error connecting to database: ${error.message}`);
//     process.exit(1);
//   }
// };




const connectToDatabase = async () => {
  try {
    const db = await mongoose.connect(uri, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${db.connection.host}`);
  } catch (error) {
    console.error(`${error.message}`);
    process.exit(1);
  }
};


module.exports = { connectToDatabase };


