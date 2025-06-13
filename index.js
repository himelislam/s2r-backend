const express = require("express");
const session = require("express-session");
const cors = require("cors");
const app = express();
const MongoStore = require('connect-mongo');
require("dotenv").config();
const { connectToDatabase } = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");
const {
  app: { port, cors_origin },
  mongo: {session_secret, uri}
} = require("./config/env")
const authRoutes = require('./routes/authRoutes')
const businessRoutes = require('./routes/businessRoutes');
const referrerRoutes = require('./routes/referrerRoutes');
const refereeRoutes = require('./routes/refereeRoutes')
const memberRoutes = require('./routes/memberRoutes')
const campaignRoutes = require('./routes/campaignRoutes')
const integrationRoutes = require('./routes/integrationRoutes')
const paymentRoutes = require('./routes/paymentRoutes');

const PORT = port || 8000;


app.use(
  session({
    secret: session_secret || "this-is-a-secret-key-change-me",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: uri,
      ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    })
  })
);

// Cors options
var cors_options = {
  // origin: cors_origin ? cors_origin : "*",
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(cors_options));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Routes
app.use("/api/auth", authRoutes);
app.use('/api/business', businessRoutes)
app.use('/api/referrer', referrerRoutes)
app.use('/api/referee', refereeRoutes)
app.use('/api/member', memberRoutes)
app.use('/api/campaign', campaignRoutes)
app.use('/api/integration', integrationRoutes)
app.use('/api/payment', paymentRoutes )


app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the Attach N' Hatch server" });
});

app.use(errorHandler);

// Connect to the database before start the server
// connectToDatabase().then(() => {
//   app.listen(PORT, err => {
//     if (err) {
//       console.error(err);
//       return process.exit(1);
//     }
//     console.info(`\n#########################################################\n          Server listening on port: ${PORT} \n#########################################################\n`, "Starting server");
//   });
// });

if (require.main === module) {
  // Running as a standalone server (for local development)
  connectToDatabase().then(() => {
    app.listen(PORT, err => {
      if (err) {
        console.error(err);
        return process.exit(1);
      }
      console.info(`\n#########################################################\n          Server listening on port: ${PORT} \n#########################################################\n`, "Starting server");
    });
  });
} else {
  // Running as a module (for Vercel serverless functions)
  module.exports = app;
}