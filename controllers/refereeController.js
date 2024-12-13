const asyncHandler = require('express-async-handler');
const Referrer = require('../models/referrerModel')
const { mailer: { client_url } } = require('../config/env')

const createReferee = asyncHandler(async (req, res) => {
    const { name, email, phone, date, businessId, referrerId } = req.body;
    try {
        if (!name || !email || !phone || !date || !businessId || !referrerId) {
            res.status(400).json({ message: "Please include all fields" });
            throw new Error("Please include all fields");
        }

        const referrer = await Referrer.findById(referrerId);

        referrer.referees.push({
            name,
            email,
            phone,
            date,
            businessId
        })

        const saved = await referrer.save()

        if(saved){
            res.status(201).json({message: 'Sent Successfully'})
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

module.exports = {
    createReferee,
};