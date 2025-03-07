const asyncHandler = require('express-async-handler');
const Referrer = require('../models/referrerModel')
const Referee = require('../models/refereeModel')
const { mailer: { client_url } } = require('../config/env')

const createReferee = asyncHandler(async (req, res) => {
    const { name, email, phone, date, businessId, campaignId, referrerId } = req.body;
    try {
        if (!name || !email || !businessId || !referrerId ) {
            res.status(400).json({ message: "Please include all fields" });
            throw new Error("Please include all fields");
        }

        const referrer = await Referrer.findById(referrerId);

        if (!referrer) {
            return res.status(404).json({ message: "Referrer not found" });
        }

        const referee = await Referee.create({
            name,
            email,
            phone,
            date,
            businessId,
            campaignId,
            referrerId,
            referrerName: referrer.name,
            status: 'Active'
        })

        if (referee) {
            res.status(201).json({ message: 'Sent Successfully' })
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

const getRefereeByReferrerId = asyncHandler(async (req, res) => {
    const { referrerId } = req.body;

    try {
        const referees = await Referee.find({ referrerId: referrerId });

        if (referees) {
            res.status(201).json(referees);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

const getRefereeByBusinessId = asyncHandler(async (req, res) => {
    const { businessId } = req.body;

    try {
        const referees = await Referee.find({ businessId: businessId });

        if (referees) {
            res.status(201).json(referees);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

const getRefereeList = asyncHandler(async (req, res) => {
    const { refereerId } = req.body;

    try {
        const referees = await Referee.find({ referrerId: refereerId });
        if (referees) {
            res.status(201).json(referees);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = {
    createReferee,
    getRefereeByReferrerId,
    getRefereeByBusinessId,
    getRefereeList
};