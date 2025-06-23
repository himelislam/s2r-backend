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

//     const initialized = await Config.findOne({ key: 'stripe_initialized' });

//     if (!initialized) {
//       await StripeService.initializePlans();
//       console.log('Stripe plans initialized successfully');

//       await Config.create({ key: 'stripe_initialized', value: true });
//     } else {
//       console.log('Stripe plans already initialized, skipping...');
//     }

//   } catch (error) {
//     console.error(`Error connecting to database: ${error.message}`);
//     process.exit(1);
//   }
// };




// const connectToDatabase = async () => {
//   try {
//     const db = await mongoose.connect(uri, {
//       // useNewUrlParser: true,
//       // useUnifiedTopology: true,
//     });
//     console.log(`MongoDB Connected: ${db.connection.host}`);
//   } catch (error) {
//     console.error(`${error.message}`);
//     process.exit(1);
//   }
// };


// module.exports = { connectToDatabase };


// Serverless connection caching
// let cached = global.mongoose;

// if (!cached) {
//   cached = global.mongoose = { conn: null, promise: null };
// }

// const connectToDatabase = async () => {
//   if (cached.conn) {
//     return cached.conn;
//   }

//   if (!cached.promise) {
//     const opts = {
//       bufferCommands: false, // Disable mongoose buffering
//       serverSelectionTimeoutMS: 5000, // Fail fast if can't connect
//       socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
//     };

//     cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
//       return mongoose;
//     });
//   }

//   try {
//     cached.conn = await cached.promise;
//     console.log(`MongoDB Connected: ${cached.conn.connection.host}`);
//   } catch (err) {
//     cached.promise = null;
//     console.error('Database connection error:', err);
//     throw err;
//   }

//   return cached.conn;
// };

// module.exports = { connectToDatabase };





// const mongoose = require("mongoose");
// const { mongo: { uri } } = require("./env");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectToDatabase = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Changed to true to allow buffering
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(`MongoDB Connected: ${cached.conn.connection.host}`);
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    console.error('Database connection error:', err);
    throw err;
  }
};

// Add this new function to check connection state
const ensureConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  await connectToDatabase();
  return true;
};

module.exports = { connectToDatabase, ensureConnection };