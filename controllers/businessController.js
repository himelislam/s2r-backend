const asyncHandler = require('express-async-handler');
const User = require('../models/userModel')
const Business = require('../models/businessModel')
const { mailer: { client_url } } = require('../config/env')
const QRCode = require('qrcode');

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
            const referrerId = `unassigned-${existingQrCodesCount + i + 1}`;
            const uniqueId = existingQrCodesCount + i + 1 // Generate a unique ID
            const url = `${client_url}/qr/${businessId}/${referrerId}`;
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


module.exports = {
    createBusiness,
    getAllBusiness,
    generateQrCodes,
    getBusinessById
};