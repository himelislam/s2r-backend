const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const { jwt: { secret } } = require('../config/env')

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please include all fields");
    }

    const userExists = await User.findOne({ email })
    if (userExists) {
        res.status(400);
        throw new Error("User already exists")
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
        name,
        email,
        password: hashedPassword
    })

    console.log(user, "asd");

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            userType: user.userType,
            token: generateToken(user._id)
        })
    } else {
        res.status(400);
        throw new Error("Invalid credentials")
    }
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        })
    } else {
        res.status(400);
        throw new Error("Invalid Credentials")
    }
})

const logoutUser = asyncHandler(async (req, res) => {
    if (req.session) {
        req.session.destroy(function (err) {
            if (err) {
                console.error("Something went wrong!", err); // Log the actual error
                return res.status(500).json({ message: "Failed to log out. Please try again later." });
            }
            // Session successfully destroyed
            res.redirect("/");
        })
    } else {
        res.status(400).json({ message: "Cannot log out, no session found" });
    }
})


const generateToken = (id) => {
    return jwt.sign({ id }, secret, {
        expiresIn: "10d",
    });
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser
};