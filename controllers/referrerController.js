const asyncHandler = require('express-async-handler');
const User = require('../models/userModel')
const Referrer = require('../models/referrerModel')

const createReferrer = asyncHandler(async (req, res) => {
    const { name, email, phone, signature, userType, businessId } = req.body;
    if (!name || !email || !phone || !signature || !userType || !businessId ) {
        res.status(400);
        throw new Error("Please include all fields");
    }

    const userExists = await User.findOne({ email })
    if (userExists) {
        userExists.userType = userType;
        await userExists.save();
        console.log('user type updated');
    }else{
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
        const saved  = await userExists.save();
        if(saved){
            res.status(201).json({
                _id: referrer._id,
                name: referrer.name,
                email: referrer.email,
                phone: referrer.phone,
                signature: referrer.signature,
                businessId: referrer.businessId
            })
        }else{
            throw new Error("Unable to set business Id on user")
        }
    } else {
        res.status(400);
        throw new Error("Invalid credentials")
    }
})

module.exports = {
    createReferrer
};