const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const nodemailer = require('nodemailer');
const { jwt: { secret }, mailer: { email, email_password, client_url } } = require('../config/env')

const registerUser = asyncHandler(async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(404).json({ message: "Please include all fields" });
        }

        const userExists = await User.findOne({ email })
        if (userExists) {
            res.status(404).json({ message: "User already registered" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        })

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                token: generateToken(user._id)
            })
        } else {
            res.status(404).json({ message: "Failed to create user" });
            throw new Error("Failed to create user")
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            res.status(404).json({ message: "User does not exist" });
        }
        else if (user && !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({ message: "Incorrect password" });
        } else {
            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                userId: user.userId,
                token: generateToken(user._id)
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
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

const forgetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const resetToken = jwt.sign({ id: user._id }, secret, { expiresIn: '1h' });
        user.resetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 3600000;
        await user.save();

        const resetURL = `${client_url}/reset-password/${resetToken}`;
        await transporter.sendMail({
            to: email,
            subject: 'Reset Password',
            html: `<p>Click <a href="${resetURL}">here</a> to reset your password.</p>`
        })
        res.json({ message: 'Password reset link sent to email.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
})

const resetPassword = asyncHandler(async (req, res) => {
    const { password, token } = req.body;

    try {
        const decoded = jwt.verify(token, secret);
        const user = await User.findOne({
            _id: decoded.id,
            resetToken: token,
            resetTokenExpiration: { $gt: Date.now() }
        })

        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        user.save();

        res.status(201).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
})


const generateToken = (id) => {
    return jwt.sign({ id }, secret, {
        expiresIn: "10d",
    });
}

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: email,
        pass: email_password,
    },
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    forgetPassword,
    resetPassword
};