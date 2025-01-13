const asyncHandler = require('express-async-handler');
const User = require('../models/userModel')
const Business = require('../models/businessModel')
const Member = require('../models/memberModel');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const { jwt: { secret }, mailer: { email, email_password, client_url } } = require('../config/env')
const mongoose = require("mongoose");

const createBusiness = asyncHandler(async (req, res) => {
    const { businessName, businessEmail, name, email, phone, address, userType } = req.body;
    try {
        if (!name || !email || !phone || !businessEmail || !businessName || !address || !userType) {
            res.status(404).json({ message: "Please include all fields" });
            throw new Error("Please include all fields");
        }

        const userExists = await User.findOne({ email })
        if (userExists) {
            userExists.userType = userType;
            await userExists.save();
        } else {
            throw new Error('Unable to set owner on user scma')
        }

        const business = await Business.create({
            businessName,
            name,
            email,
            businessEmail,
            phone,
            address
        })

        if (business) {
            userExists.userId = business._id
            const saved = await userExists.save();
            if (saved) {
                res.status(201).json({
                    _id: business._id,
                    businessName: business.businessName,
                    name: business.name,
                    email: business.email,
                    businessEmail: business.businessEmail,
                    phone: business.phone,
                    address: business.address
                })
            } else {
                throw new Error("Unable to set business Id on user")
            }
        } else {
            res.status(400).json({ message: "Unable to create business" });
            throw new Error("Invalid credentials")
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
})

const getAllBusiness = asyncHandler(async (req, res) => {
    try {
        const businesses = await Business.find();
        res.status(200).json(businesses);
    } catch (error) {
        console.error("Error fetching businesses:", error);
        res.status(500).json({ message: 'Failed to fetch businesses' });
    }
})

const getBusinessById = asyncHandler(async (req, res) => {
    const { businessId } = req.body;

    try {
        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(400).json({ message: 'Business Not Found' })
        }

        res.status(201).json(business);
    } catch (error) {
        console.error("Error getting Business:", error);
        res.status(500).json({ message: "Failed to get business" });
    }
})

const updateProfile = asyncHandler(async (req, res) => {
    const { name, email, businessId, userId } = req.body;

    try {
        // Find business by ID
        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }

        // Find the user by email
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (email !== user.email) {
            const emailExists = await User.findOne({ email: email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email Already Exists' });
            }
        }

        // Update user and business details
        business.name = name;
        business.email = email;
        user.name = name;
        user.email = email;

        // Save the updates
        const savedBusiness = await business.save();
        const savedUser = await user.save();

        if (savedBusiness && savedUser) {
            return res.status(201).json({ 
                name: user.name,
                email: user.email,
            });
        } else {
            return res.status(500).json({ message: "Failed to save updates" });
        }

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


const generateQrCodes = asyncHandler(async (req, res) => {
    const { businessId, numberOfCodes } = req.body;
    try {
        // Validate the business ID
        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ message: "Business not found" });
        }
        const existingQrCodesCount = business.qrCodes.length;
        const newQrCodes = [];

        // Generate QR codes and add them to the PDF
        for (let i = 0; i < numberOfCodes; i++) {
            // const referrerId = `unassigned-${i}`;
            // const referrerId = `unassigned-${existingQrCodesCount + i + 1}`;
            const uniqueId = existingQrCodesCount + i + 1 // Generate a unique ID
            const url = `${client_url}/qr/${businessId}/${uniqueId}`;
            const qrCodeBase64 = await QRCode.toDataURL(url); // Generate QR code as Base64
            // Prepare QR code details for the database
            newQrCodes.push({
                id: uniqueId,
                url,
                qrCodeBase64: qrCodeBase64,
                generationDate: new Date(),
                status: 'unassigned'
            });
        }

        // Save the new QR codes to the business document
        business.qrCodes.push(...newQrCodes);
        await business.save();

        res.status(201).json({ message: "Qr Codes generated successfully" })
    } catch (error) {
        console.error("Error generating QR codes:", error);
        res.status(500).json({ message: "Failed to generate QR codes" });
    }
})

const inviteReferrer = asyncHandler(async (req, res) => {
    const { businessId, email, name } = req.body;

    const session = await mongoose.startSession(); // Start a session
    session.startTransaction()

    try {
        // creating the member first with session
        const member = await Member({
            name,
            email,
            businessId,
            status: 'Invited'
        })
        await member.save({ session })

        const business = await Business.findById(businessId).session(session)
        const inviteURL = `${client_url}/referrer-signup/${businessId}/${email}/${name}`;

        const sent = await transporter.sendMail({
            to: email,
            subject: `Referrer Invitation from ${business?.name}`,
            // html: `<p>Click <a href="${resetURL}">here</a> to reset your password.</p>`
            html: `<!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Referrer Invitation</title>
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
                                <h1>Referrer Invitation</h1>
                                <p>${business?.name} has invited you to join a referrer</p>
                                <p>If you didn’t request this, please ignore this email. Otherwise, you can join as a referrer by clicking the button below:</p>
                                <div class="button-container">
                                    <a href="${inviteURL}" class="button">Sign Up</a>
                                </div>
                                <p>If you have any questions, feel free to contact our support team.</p>
                            </div>
                            <div class="footer">
                                <p>&copy; ${new Date().getFullYear()} Attach N' Hatch. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>`
        })

        if (sent && member) {
            await session.commitTransaction();
            session.endSession();
            res.status(200).json({ message: 'Invitation mail sent successfully' });
        }

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Failed to send Invitation mail", error);
        if (error.code === 11000) {
            res.status(400).json({ message: 'Email already exists.' });
        } else {
            res.status(500).json({ message: "Failed to send Invitation mail" });
        }
    }
})

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: email,
        pass: email_password,
    },
});


module.exports = {
    createBusiness,
    getAllBusiness,
    generateQrCodes,
    getBusinessById,
    inviteReferrer,
    updateProfile
};