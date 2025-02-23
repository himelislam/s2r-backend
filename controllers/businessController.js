const asyncHandler = require('express-async-handler');
const User = require('../models/userModel')
const Business = require('../models/businessModel')
const Member = require('../models/memberModel');
const Referrer = require('../models/referrerModel');
const Campaign = require('../models/campaignModel')
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const { jwt: { secret }, mailer: { email, email_password, client_url } } = require('../config/env')
const mongoose = require("mongoose");
const { cloudinary } = require('../helpers/cloudinary.helper');

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

const addReferrer = asyncHandler(async (req, res) => {
    const { name, email, phone, userType, businessId, campaignId } = req.body;

    if (!name || !email || !phone || !userType || !businessId || !campaignId) {
        return res.status(400).json({ message: "Please include all fields" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Create user within transaction
        const user = new User({ name, email });
        await user.save({ session });

        user.userType = userType;
        await user.save({ session });

        // Create referrer
        const referrer = new Referrer({
            name,
            email,
            phone,
            businessId,
            campaignId
        });
        await referrer.save({ session });

        user.userId = referrer._id;
        await user.save({ session });

        const business = await Business.findById(businessId).session(session);
        const uniqueId = business.qrCodes.length + 1;
        const url = `${client_url}/qr/${businessId}/${campaignId}/${uniqueId}`;
        const qrCodeBase64 = await QRCode.toDataURL(url);

        const availableQrCode = business.qrCodes.find(
            (qrCode) => qrCode.campaignId.toString() === campaignId && qrCode.status === "unassigned"
        );

        if (!availableQrCode) {
            business.qrCodes.push({
                id: uniqueId,
                referrerId: referrer._id,
                referrerName: referrer.name,
                campaignId,
                url,
                qrCodeBase64,
                generationDate: new Date(),
                status: "assigned",
            });

            referrer.qrCodeId = uniqueId;
        } else {
            availableQrCode.referrerId = referrer._id;
            availableQrCode.referrerName = referrer.name;
            availableQrCode.campaignId = campaignId;
            availableQrCode.status = "assigned";

            referrer.qrCodeId = uniqueId - 1; // since we are replacing an already generated code
        }

        await referrer.save({ session });
        await business.save({ session });

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const member = new Member({
            name,
            email,
            businessId,
            campaignId,
            campaignName: campaign.campaignName,
            qrCode: availableQrCode || { id: uniqueId, qrCodeBase64 },
            status: "Created"
        });
        await member.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Send email AFTER committing transaction
        const mailSent = await sendReferrerWelcomeEmail({
            body: { businessId, email, name, campaignId, referrerId: referrer._id },
        });

        if (!mailSent) {
            console.error("Warning: Email failed to send");
            const retryMailSent = await sendReferrerWelcomeEmail({
                body: { businessId, email, name, campaignId, referrerId: referrer._id },
            });
            if (!retryMailSent) {
                console.error("Email failed after retry");
            }
        }

        return res.status(201).json({
            message: "Referrer added successfully",
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});



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
    const { name, email, businessId, userId, url } = req.body;

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
        user.url = url;

        // Save the updates
        const savedBusiness = await business.save();
        const savedUser = await user.save();

        if (savedBusiness && savedUser) {
            return res.status(201).json({
                name: user.name,
                email: user.email,
                url: user.url,
            });
        } else {
            return res.status(500).json({ message: "Failed to save updates" });
        }

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

const updateBusinessProfile = asyncHandler(async (req, res) => {
    const { businessId, businessName, businessEmail, address, phone, url } = req.body;

    try {
        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }

        // Update only the provided fields
        if (businessName) business.businessName = businessName;
        if (businessEmail) business.businessEmail = businessEmail;
        if (address) business.address = address;
        if (phone) business.phone = phone;
        if (url) business.url = url;

        // Save the updated business
        const saved = await business.save();

        if (saved) {
            return res.status(200).json({ message: 'Business updated successfully' });
        } else {
            return res.status(500).json({ message: 'Failed to update business' });
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

const generateQrCodes = asyncHandler(async (req, res) => {
    const { businessId, numberOfCodes, campaignId } = req.body;
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
            const url = `${client_url}/qr/${businessId}/${campaignId}/${uniqueId}`;
            const qrCodeBase64 = await QRCode.toDataURL(url); // Generate QR code as Base64
            // Prepare QR code details for the database
            newQrCodes.push({
                id: uniqueId,
                campaignId: campaignId,
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
    const { businessId, email, name, campaignId } = req.body;

    const session = await mongoose.startSession(); // Start a session
    session.startTransaction()

    try {
        // creating the member first with session
        const member = await Member({
            name,
            email,
            businessId,
            campaignId,
            status: 'Invited'
        })
        await member.save({ session })

        const business = await Business.findById(businessId).session(session)
        const campaign = await Campaign.findById(campaignId).session(session)
        const inviteURL = `${client_url}/referrer-signup/${businessId}/${campaignId}/${email}/${name}`;

        const sent = await transporter.sendMail({
            to: email,
            subject: `Referrer Invitation from ${business?.name} to join ${campaign?.campaignName}`,
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

const sendReferrerWelcomeEmail = asyncHandler(async (req, res) => {
    const { businessId, email, name, campaignId, referrerId } = req.body;

    const session = await mongoose.startSession(); // Start a session
    session.startTransaction();

    try {
        const business = await Business.findById(businessId).session(session);
        const campaign = await Campaign.findById(campaignId).session(session);

        if (!business || !campaign) {
            throw new Error("Business or Campaign not found.");
        }

        // Proper way to find the QR code
        const qrCode = business.qrCodes.find(qr => qr.referrerId?.toString() === referrerId.toString());

        if (!qrCode) {
            throw new Error("QR Code not found for the given referrer.");
        }

        const refereeListURL = `${client_url}/referee-list/${referrerId}`;
        const signupURL = `${client_url}/referrer-setup-pass/${businessId}/${referrerId}/${email}`;

        const sent = await transporter.sendMail({
            to: email,
            subject: `Joined on campaign from ${business?.name}`,
            html: `<!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Account Created Successfully</title>
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
                                <h1>You have successfully joined as a referrer on ${campaign?.campaignName}</h1>
                                <p>${business?.name} has invited you to join a referrer</p>
                                <p>To sign up on the dashboard; please click the link below to set the password:</p>
                                <div class="button-container">
                                    <a href="${signupURL}" class="button">Sign Up</a>
                                </div>

                                <div class="content">
                                    <p>Here is your QR code for the campaign:</p>
                                    <img src="${qrCode?.qrCodeBase64}" alt="QR Code" />
                                </div>

                                <p>You can check out the referee list from the link below:</p>
                                <div class="button-container">
                                    <a href="${refereeListURL}" class="button">Sign Up</a>
                                </div>
                                
                                <p>If you have any questions, feel free to contact our support team.</p>
                            </div>
                            <div class="footer">
                                <p>&copy; ${new Date().getFullYear()} Attach N' Hatch. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>`
        });

        if (sent) {
            await session.commitTransaction(); // Commit transaction
            session.endSession(); // End session after committing
            // return res.status(200).json({ message: 'Invitation mail sent successfully' });
            return true;
        }

        throw new Error("Failed to send email.");
    } catch (error) {
        session.endSession();
        console.error("Failed to send invitation mail", error);
        return false
    }
});


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

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: email,
        pass: email_password,
    },
});


module.exports = {
    createBusiness,
    addReferrer,
    getAllBusiness,
    generateQrCodes,
    getBusinessById,
    inviteReferrer,
    updateProfile,
    updateBusinessProfile,
    uploadProfileImage
};