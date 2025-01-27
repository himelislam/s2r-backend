const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const nodemailer = require('nodemailer');
const { jwt: { secret }, mailer: { email, email_password, client_url } } = require('../config/env');
const { cloudinary } = require('../helpers/cloudinary.helper');
const fs = require('fs');

const registerUser = asyncHandler(async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(404).json({ message: "Please include all fields" });
        }

        const userExists = await User.findOne({ email })
        if (userExists) {
            return res.status(404).json({ message: "User already registered" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        })

        if (user) {
            return res.status(201).json({
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
            return res.status(404).json({ message: "User does not exist" });
        }
        else if (user && !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Incorrect password" });
        } else {
            return res.status(200).json({
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
        return res.status(500).json({ message: 'Internal Server error' });
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
            // html: `<p>Click <a href="${resetURL}">here</a> to reset your password.</p>`
            html: `<!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Reset Your Password</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f9f9f9;
                                margin: 0;
                                padding: 0;
                                color: #333;
                            }
                            .container {
                                max-width: 600px;
                                margin: 30px auto;
                                background: #ffffff;
                                padding: 20px;
                                border: 1px solid #dddddd;
                                border-radius: 5px;
                            }
                            .header {
                                text-align: center;
                                padding: 10px 0;
                            }
                            .header img {
                                max-width: 150px;
                            }
                            .content {
                                margin: 20px 0;
                                text-align: center;
                            }
                            .content h1 {
                                color: #444;
                                font-size: 24px;
                            }
                            .content p {
                                font-size: 16px;
                                margin-bottom: 20px;
                                color: #666;
                            }
                            .button-container {
                                text-align: center;
                                margin: 20px 0;
                            }
                            .button {
                                background-color: #007BFF;
                                color: white !important;
                                padding: 10px 20px;
                                text-decoration: none;
                                border-radius: 5px;
                                font-size: 16px;
                            }
                            .footer {
                                text-align: center;
                                margin-top: 20px;
                                font-size: 12px;
                                color: #999;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <img src="https://t3.ftcdn.net/jpg/05/16/27/60/360_F_516276029_aMcP4HU81RVrYX8f5qCAOCCuOiCsu5UF.jpg" alt="Attach N' Hatch Logo">
                            </div>
                            <div class="content">
                                <h1>Reset Your Password</h1>
                                <p>We received a request to reset your password for your Attach N' Hatch account.</p>
                                <p>If you didn’t request this, please ignore this email. Otherwise, you can reset your password by clicking the button below:</p>
                                <div class="button-container">
                                    <a href="${resetURL}" class="button">Reset Password</a>
                                </div>
                                <p>This link will expire in 1 hour. If you have any questions, feel free to contact our support team.</p>
                            </div>
                            <div class="footer">
                                <p>&copy; ${new Date().getFullYear()} Attach N' Hatch. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>`
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

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, userId } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword || !userId) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user password
        user.password = hashedPassword;
        await user.save();

        // Respond with success
        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Server error" });
    }
});



// const uploadProfileImage = asyncHandler(async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: 'No file uploaded' });
//         }

//         // Validate file type
//         if (!req.file.mimetype.startsWith('image/')) {
//             return res.status(400).json({ error: 'Only image files are allowed' });
//         }

//         // Upload image to Cloudinary
//         const result = await cloudinary.uploader.upload(req.file.path, {
//             folder: 'user',
//             public_id: `user_${Date.now()}`, // Optional: Custom public ID
//         });

//         // Delete the temporary file
//         fs.unlinkSync(req.file.path);

//         res.json({ url: result.secure_url });
//     } catch (error) {
//         console.error(error);

//         // Delete the temporary file in case of an error
//         if (req.file) {
//             fs.unlinkSync(req.file.path);
//         }

//         if (error.http_code === 400) {
//             return res.status(400).json({ error: 'Invalid file or upload request' });
//         } else if (error.http_code === 401) {
//             return res.status(500).json({ error: 'Cloudinary authentication failed' });
//         } else {
//             return res.status(500).json({ error: 'Failed to upload image' });
//         }
//     }
// });

const uploadProfileImage = asyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Validate file type
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'Only image files are allowed' });
        }

        // Upload the file directly from memory to Cloudinary
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'business',
                public_id: `user_${Date.now()}`,
            },
            (error, result) => {
                if (error) {
                    return res.status(500).json({ error: 'Upload failed' });
                }
                res.json({ url: result.secure_url });
            }
        );

        // Pipe the file buffer into the upload stream
        stream.end(req.file.buffer);
    } catch (error) {
        console.error(error);

        return res.status(500).json({ error: 'An error occurred while uploading the image' });
    }
});



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
    resetPassword,
    changePassword,
    uploadProfileImage
};