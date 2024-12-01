const mongoose = require("mongoose");
const { mongo: { uri } } = require("./env");

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