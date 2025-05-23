const asyncHandler = require('express-async-handler');
const User = require('../models/userModel')
const Referrer = require('../models/referrerModel')
const Business = require('../models/businessModel')
const Campaign = require('../models/campaignModel')
const Member = require('../models/memberModel')
const { mailer: { client_url } } = require('../config/env')
const QRCode = require('qrcode');
const mongoose = require("mongoose");

const createReferrer = asyncHandler(async (req, res) => {
    const { name, email, phone, signature, userType, businessId, campaignId, invited } = req.body;

    const session = await mongoose.startSession(); // Start a session
    session.startTransaction()

    try {
        if (!name || !email || !phone || !signature || !userType || !businessId || !campaignId) {
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
            businessId,
            campaignId
        })

        await referrer.save({ session })

        if (referrer) {
            userExists.userId = referrer._id
            const saved = await userExists.save({ session });

            const business = await Business.findById(businessId).session(session)
            const existingQrCodesCount = business.qrCodes.length;
            const uniqueId = existingQrCodesCount + 1 // Generate a unique ID
            const url = `${client_url}/qr/${businessId}/${campaignId}/${uniqueId}`
            const qrCodeBase64 = await QRCode.toDataURL(url) // Generate QR code as Base64

            //setting up the qrcodes with the referrer
            if (saved) {
                // const availableQrCode = business.qrCodes.find(qrCode => qrCode.status === 'unassigned')
                const campaignQrCodes = business.qrCodes.filter(
                    (qrCode) => qrCode.campaignId.toString() === campaignId
                );

                //Find an unassigned QR code
                const availableQrCode = campaignQrCodes.find(
                    (qrCode) => qrCode.status === "unassigned"
                );

                if (invited) {
                    const member = await Member.findOne({
                        businessId: businessId,
                        email: email,
                        campaignId: campaignId
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
                        campaignId: campaignId,
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
                            businessId: referrer.businessId,
                            campaignId: referrer.campaignId
                        })
                    }
                } else {
                    // business has generated pre generated qr codes or already have some.
                    if (availableQrCode) {
                        availableQrCode.referrerId = referrer?._id,
                            availableQrCode.referrerName = referrer?.name,
                            availableQrCode.campaignId = campaignId,
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

        if (!referrers) {
            return res.status(404).json({ message: "Referrer not found" });
        }

        const detailedReferrer = await Promise.all(
            referrers.map(async (ref) => {
                const campaign = await Campaign.findById(ref.campaignId);

                return {
                    ...ref.toObject(),
                    campaignName: campaign?.campaignName,
                    campaignStatus: campaign?.active
                };
            })
        );

        res.status(201).json(detailedReferrer);
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

const getQrCodeByReferrerId = asyncHandler(async (req, res) => {
    const { referrerId, businessId } = req.body;

    try {
        // Correct the query to use an object
        const business = await Business.findOne({ _id: businessId }); // Pass an object as the filter

        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }

        // Use Array.prototype.find() to locate the matching QR code
        const qrCode = business.qrCodes.find(qrCode => qrCode.referrerId == referrerId);

        if (!qrCode) {
            return res.status(404).json({ message: 'QR Code not found' });
        }

        res.status(200).json(qrCode);

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' });

    }
})

const updateReferrerProfile = asyncHandler(async (req, res) => {
    const { referrerId, userId, name, email, phone, url } = req.body;

    try {
        const referrer = await Referrer.findById(referrerId);
        if (!referrer) {
            return res.status(400).json({ message: 'Referrer not found' })
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' })
        }

        if (email !== user.email) {
            const emailExists = await User.findOne({ email: email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email Already Exists' });
            }
        }

        const updateResult = await Business.updateOne(
            { "qrCodes.referrerId": referrerId }, // Find the document with matching referrerId in qrCodes
            { $set: { "qrCodes.$.referrerName": name } } // Update the referrerName field of the matched element
        );

        if (name) referrer.name = name;
        if (email) referrer.email = email;
        if (phone) referrer.phone = phone;
        if (url) referrer.url = url;

        if (name) user.name = name;
        if (email) user.email = email;
        if (url) user.url = url;

        const savedReferrer = await referrer.save();
        const savedUser = await user.save();

        if (savedReferrer && savedUser && updateResult) {
            res.status(201).json({
                name: referrer.name,
                email: referrer.email,
                phone: referrer.phone,
                url: referrer.url
            })
        } else {
            return res.status(500).json({ message: "Failed to save updates" });
        }

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' });
    }
})


module.exports = {
    createReferrer,
    getReferrersByBusinessId,
    getReferrerById,
    getQrCodeByReferrerId,
    updateReferrerProfile
};