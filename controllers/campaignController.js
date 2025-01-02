const asyncHandler = require('express-async-handler');
const Campaign = require('../models/campaignModel')
const { jwt: { secret }, mailer: { email, email_password, client_url } } = require('../config/env')

const createCampaign = asyncHandler(async (req, res) => {
    const {businessId, campaignName, campaignLanguage} = req.body;

    try {
        const campaign = await Campaign.create({
            businessId,
            campaignName,
            campaignLanguage
        })

        res.status(201).json(campaign);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
})

const getCampaignsByBusinessId = asyncHandler(async (req, res) => {
    const { businessId } = req.body;

    try {
        const campaigns = await Campaign.find({ businessId });

        res.status(200).json(campaigns);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
})

const updateCampaignActiveStatus = asyncHandler(async (req, res) => {
    const { campaignId, activeStatus } = req.body;

    try {
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
            res.status(404).json({ message: 'Campaign not found' });
        }

        campaign.active = activeStatus;
        await campaign.save();

        res.status(200).json(campaign);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
})


module.exports = {
    createCampaign,
    getCampaignsByBusinessId,
    updateCampaignActiveStatus
};