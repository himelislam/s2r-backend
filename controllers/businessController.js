const asyncHandler = require('express-async-handler');
const User = require('../models/userModel')
const Business = require('../models/businessModel')
const { mailer : client_url } = require('../config/env')
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require("uuid");

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
        const businesses = await Business.find(); // Retrieve all documents
        console.log(businesses);
        res.status(200).json(businesses);
    } catch (error) {
        console.error("Error fetching businesses:", error);
        res.status(500).json({ message: 'Failed to fetch businesses' });
    }
})

const generateQrCodes = asyncHandler(async (req, res) => {
    const {businessId, numberOfCodes } = req.body;

    console.log(businessId, "busness id");

    try {
        // Validate the business ID
        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ message: "Business not found" });
        }

        // Set the response headers to serve the PDF as a download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=qr-codes.pdf");

        // Create a new PDFDocument instance
        const doc = new PDFDocument();

        // Pipe the PDF data directly to the response
        doc.pipe(res);

        // Array to hold new QR codes for bulk insertion
        const newQrCodes = [];

        // Generate QR codes and add them to the PDF
        for (let i = 0; i < numberOfCodes; i++) {
            const referrerId = `unassigned-${i}`;
            const uniqueId = uuidv4(); // Generate a unique ID
            const url = `${client_url}/qr/${businessId}/${referrerId}`;
            const qrCodeBase64 = await QRCode.toDataURL(url); // Generate QR code as Base64

            // Add QR code image to the PDF
            doc.image(Buffer.from(qrCodeBase64.split(",")[1], "base64"), {
                fit: [100, 100],
                align: "center",
                valign: "center",
            });
            doc.text(`Business ID: ${businessId}`, { align: "center" });
            doc.text(`Referrer ID: ${referrerId}`, { align: "center" });
            doc.moveDown();

            // Prepare QR code details for the database
            newQrCodes.push({
                id: uniqueId,
                url,
                qrCode: qrCodeBase64,
                generationDate: new Date(),
            });
        }

        // Save the new QR codes to the business document
        business.qrCodes.push(...newQrCodes);
        await business.save();

        // Finalize the PDF and end the response
        doc.end();
    } catch (error) {
        console.error("Error generating QR codes:", error);
        res.status(500).json({ message: "Failed to generate QR codes" });
    }
})

// const generateQRCode = async (businessId, referrerId) => {
//     const url = `${client_url}/r/${businessId}/${referrerId}`;
//     const qrCode = await QRCode.toDataURL(url); // Generate QR code as Base64 image
//     return qrCode;
// };

module.exports = {
    createBusiness,
    getAllBusiness,
    generateQrCodes
};