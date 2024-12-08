const asyncHandler = require('express-async-handler');
const User = require('../models/userModel')
const Referrer = require('../models/referrerModel')
const Business = require('../models/businessModel')
const { mailer: { client_url } } = require('../config/env')
const QRCode = require('qrcode');

const createReferrer = asyncHandler(async (req, res) => {
    const { name, email, phone, signature, userType, businessId } = req.body;
    try {
        if (!name || !email || !phone || !signature || !userType || !businessId) {
            res.status(400).json({ message: "Please include all fields" });
            throw new Error("Please include all fields");
        }

        const userExists = await User.findOne({ email })
        if (userExists) {
            userExists.userType = userType;
            await userExists.save();
        } else {
            throw new Error('Unable to set referrer on user schema')
        }

        const referrer = await Referrer.create({
            name,
            email,
            phone,
            // signature,
            businessId
        })

        if (referrer) {
            userExists.userId = referrer._id
            const saved = await userExists.save();
            const business = await Business.findById(businessId);
            const existingQrCodesCount = business.qrCodes.length;
            const uniqueId = existingQrCodesCount + 1 // Generate a unique ID
            const url = `${client_url}/qr/${businessId}/${referrer?._id}`;
            const qrCodeBase64 = await QRCode.toDataURL(url); // Generate QR code as Base64

            if (saved) {
                const availableQrCode = business.qrCodes.find(qrCode => qrCode.status === 'unassigned')
                //setting up the qrcodes with the referrer
                if (business.qrCodes.length == 0 || availableQrCode == undefined) {
                    // business does not yet have pre generated the qr codes
                    business.qrCodes.push({
                        id: uniqueId,
                        referrerId: referrer?._id,
                        referrerName: referrer?.name,
                        url,
                        qrCodeBase64: qrCodeBase64,
                        generationDate: new Date(),
                        status: 'assigned'
                    });

                    referrer.qrCodeId = uniqueId;
                    const referrerSaved = await referrer.save();
                    const newQrCodesSaved = await business.save();

                    if (newQrCodesSaved && referrerSaved) {
                        res.status(201).json({
                            _id: referrer._id,
                            name: referrer.name,
                            email: referrer.email,
                            phone: referrer.phone,
                            signature: referrer.signature,
                            businessId: referrer.businessId
                        })
                    }
                } else {
                    // business has generated pre generated qr codes or already have some.
                    if (availableQrCode) {
                        availableQrCode.referrerId = referrer?._id,
                        availableQrCode.referrerName = referrer?.name,
                        availableQrCode.url = url,
                        availableQrCode.qrCodeBase64 = qrCodeBase64,
                        availableQrCode.status = 'assigned'

                        referrer.qrCodeId = uniqueId - 1; // since we are replacing a already generated code
                        const referrerSaved = await referrer.save();
                        const newQrCodesSaved = await business.save();

                        if (newQrCodesSaved && referrerSaved) {
                            res.status(201).json({
                                _id: referrer._id,
                                name: referrer.name,
                                email: referrer.email,
                                phone: referrer.phone,
                                signature: referrer.signature,
                                businessId: referrer.businessId
                            })
                        }
                    }
                }
            } else {
                throw new Error("Unable to set business Id on user")
            }
        } else {
            res.status(400).json({ message: "Unable to create referrer" });
            throw new Error("Invalid credentials")
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

const getReferrersByBusinessId = asyncHandler(async (req, res) => {
    const { businessId } = req.body;
    try {
        const referrers = await Referrer.find({ businessId: businessId })
        res.status(200).json(referrers)
    } catch (error) {
        res.status(400);
        throw new Error("Unable to find referrer by business Id")
    }
})

module.exports = {
    createReferrer,
    getReferrersByBusinessId
};