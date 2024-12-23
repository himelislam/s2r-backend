const asyncHandler = require('express-async-handler');
const User = require('../models/userModel')
const Referrer = require('../models/referrerModel')
const Business = require('../models/businessModel')
const Member = require('../models/memberModel')
const { mailer: { client_url } } = require('../config/env')
const QRCode = require('qrcode');
const mongoose = require("mongoose");

const createReferrer = asyncHandler(async (req, res) => {
    const { name, email, phone, signature, userType, businessId, invited } = req.body;

    const session = await mongoose.startSession(); // Start a session
    session.startTransaction()

    try {
        if (!name || !email || !phone || !signature || !userType || !businessId) {
            res.status(400).json({ message: "Please include all fields" });
            throw new Error("Please include all fields");
        }

        const userExists = await User.findOne({ email }).session(session)
        if (userExists) {
            userExists.userType = userType;
            await userExists.save({ session });
        } else {
            throw new Error('Unable to set referrer on user schema')
        }

        const referrer = await Referrer({
            name,
            email,
            phone,
            // signature,
            businessId
        })

        await referrer.save({session})

        if (referrer) {
            userExists.userId = referrer._id
            const saved = await userExists.save({ session });
            const business = await Business.findById(businessId).session(session)
            const existingQrCodesCount = business.qrCodes.length;
            const uniqueId = existingQrCodesCount + 1 // Generate a unique ID
            const url = `${client_url}/qr/${businessId}/${uniqueId}`
            const qrCodeBase64 = await QRCode.toDataURL(url) // Generate QR code as Base64

            //setting up the qrcodes with the referrer
            if (saved) {
                const availableQrCode = business.qrCodes.find(qrCode => qrCode.status === 'unassigned')

                if (invited) {
                    const member = await Member.findOne({
                        businessId: businessId,
                        email: email
                    }).session(session)

                    if (member) {
                        member.status = 'Active';
                        const memberUpdated = await member.save({ session });
                        if (!memberUpdated) {
                            await session.abortTransaction();
                            session.endSession();
                            res.status(400).json({ message: "Failed to set member status" });
                            throw new Error("Failed to update member status");
                        }
                    }
                }

                // business does not have pre generated or un-assigned qr codes 
                if (business.qrCodes.length == 0 || availableQrCode == undefined) {
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
                    const referrerSaved = await referrer.save({ session });
                    const newQrCodesSaved = await business.save({ session });

                    if (newQrCodesSaved && referrerSaved) {
                        await session.commitTransaction();
                        session.endSession();
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
                            availableQrCode.status = 'assigned'
                        referrer.qrCodeId = uniqueId - 1; // since we are replacing a already generated code

                        const referrerSaved = await referrer.save({ session });
                        const newQrCodesSaved = await business.save({ session });

                        if (newQrCodesSaved && referrerSaved) {
                            await session.commitTransaction();
                            session.endSession();
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
                await session.abortTransaction();
                session.endSession();
                throw new Error("Unable to set business Id on user")
            }
        } else {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ message: "Unable to create referrer" });
            throw new Error("Invalid credentials")
        }
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
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
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

const getReferrerById = asyncHandler(async (req, res) => {
    const { referrerId } = req.body;

    try {
        const referrer = await Referrer.findById(referrerId);
        res.status(200).json(referrer)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

module.exports = {
    createReferrer,
    getReferrersByBusinessId,
    getReferrerById
};