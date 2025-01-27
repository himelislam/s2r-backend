const asyncHandler = require('express-async-handler');
const Campaign = require('../models/campaignModel')
const { jwt: { secret } } = require('../config/env');
const { cloudinary } = require('../helpers/cloudinary.helper');
const fs = require('fs');

const createCampaign = asyncHandler(async (req, res) => {
    const { businessId, campaignName, campaignLanguage } = req.body;

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

const uploadCampaignImage = asyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Validate file type
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'Only image files are allowed' });
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'campaign'
        });
        
        // Delete the temporary file
        fs.unlinkSync(req.file.path);

        res.json({ url: result.secure_url });
    } catch (error) {
        console.error(error);

        // Delete the temporary file in case of an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to upload image' });
    }
})


module.exports = {
    createCampaign,
    getCampaignsByBusinessId,
    updateCampaignActiveStatus,
    uploadCampaignImage
};