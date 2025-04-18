const asyncHandler = require('express-async-handler');
const Referrer = require('../models/referrerModel')
const Referee = require('../models/refereeModel')
const Campaign = require('../models/campaignModel')
const { mailer: { client_url } } = require('../config/env')

const createReferee = asyncHandler(async (req, res) => {
    const { name, email, phone, date, businessId, campaignId, referrerId } = req.body;
    try {
        if (!name || !email || !businessId || !referrerId) {
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
            status: 'Pending'
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

const updateRefereeStatus = asyncHandler(async (req, res) => {
    const { refereeId, status } = req.body;

    try {
        const referee = await Referee.findById(refereeId);

        if (!referee) {
            return res.status(404).json({ message: 'Referee not found' });
        }

        referee.status = status;
        await referee.save();

        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
})

const getRefereeWithCampaignDetails = asyncHandler(async (req, res) => {
    const { businessId } = req.body;

    try {
        // Get referees
        const referees = await Referee.find({ businessId, status: 'Active' });

        // Get all unique campaign and referrer IDs
        const campaignIds = [...new Set(referees.map(r => r.campaignId))];
        const referrerIds = [...new Set(referees.map(r => r.referrerId))];

        // Fetch all campaigns and referrers in parallel
        // const [campaigns, referrers] = await Promise.all([
        //     Campaign.find({ _id: { $in: campaignIds } }),
        //     Referrer.find({ _id: { $in: referrerIds } })
        // ]);

        // Map data to referees
        // const result = referees.map(referee => ({
        //     ...referee.toObject(),
        //     campaign: campaigns.find(c => c._id.equals(referee.campaignId)),
        //     referrer: referrers.find(r => r._id.equals(referee.referrerId))
        // }));


        const detailedReferees = await Promise.all(
            referees.map(async (ref) => {
              const campaign = await Campaign.findById(ref.campaignId);
              const referrer = await Referrer.findById(ref.referrerId);
        
              return {
                ...ref.toObject(),
                campaignName: campaign?.campaignName,
                reward: campaign?.reward,
                referrerName: referrer?.name,
                referrerEmail: referrer?.email,
                qrCodeId: referrer?.qrCodeId,
                // Add anything else you need
              };
            })
          );

        res.json(detailedReferees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

module.exports = {
    createReferee,
    getRefereeByReferrerId,
    getRefereeByBusinessId,
    getRefereeList,
    updateRefereeStatus,
    getRefereeWithCampaignDetails
};