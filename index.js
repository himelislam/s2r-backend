const express = require("express");
const session = require("express-session");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { connectToDatabase } = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");
const {
  app: { port, cors_origin }
} = require("./config/env")
const authRoutes = require('./routes/authRoutes')
const businessRoutes = require('./routes/businessRoutes');
const referrerRoutes = require('./routes/referrerRoutes');
const PORT = port || 8000;


app.use(
  session({
    secret: "this is my session secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Cors options
var cors_options = {
//   origin: cors_origin ? cors_origin : "*",
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

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the Attach N' Hatch server" });
});

app.use(errorHandler);

// Connect to the database before start the server
connectToDatabase().then(() => {
  app.listen(PORT, err => {
    if (err) {
      console.error(err);
      return process.exit(1);
    }
    console.info(`\n#########################################################\n          Server listening on port: ${PORT} \n#########################################################\n`, "Starting server");
  });
});