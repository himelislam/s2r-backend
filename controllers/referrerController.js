const asyncHandler = require('express-async-handler');
const User = require('../models/userModel')
const Referrer = require('../models/referrerModel')

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
            if (saved) {
                res.status(201).json({
                    _id: referrer._id,
                    name: referrer.name,
                    email: referrer.email,
                    phone: referrer.phone,
                    signature: referrer.signature,
                    businessId: referrer.businessId
                })
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