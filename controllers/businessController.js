const asyncHandler = require('express-async-handler');
const User = require('../models/userModel')
const Business = require('../models/businessModel')

const createBusiness = asyncHandler(async (req, res) => {
    const { businessName, businessEmail, name, email, phone, address, userType } = req.body;
    if (!name || !email || !phone || !businessEmail || !businessName || !address || !userType) {
        res.status(400);
        throw new Error("Please include all fields");
    }

    const userExists = await User.findOne({ email })
    if (userExists) {
        userExists.userType = userType;
        await userExists.save();
        console.log('user type updated');
    }else{
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
        const saved  = await userExists.save();
        if(saved){
            res.status(201).json({
                _id: business._id,
                businessName: business.businessName,
                name: business.name,
                email: business.email,
                businessEmail: business.businessEmail,
                phone: business.phone,
                address: business.address
            })
        }else{
            throw new Error("Unable to set business Id on user")
        }
    } else {
        res.status(400);
        throw new Error("Invalid credentials")
    }
})

const getAllBusiness = asyncHandler(async(req, res) => {
    try {
        const businesses = await Business.find(); // Retrieve all documents
        console.log(businesses);
        res.status(200).json(businesses);
    } catch (error) {
        console.error("Error fetching businesses:", error);
        res.status(500).json({ error: 'Failed to fetch businesses' });
    }
})

module.exports = {
    createBusiness,
    getAllBusiness
};