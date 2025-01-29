const asyncHandler = require('express-async-handler');
const Campaign = require('../models/campaignModel')
const { jwt: { secret } } = require('../config/env');
const { cloudinary } = require('../helpers/cloudinary.helper');
const fs = require('fs');

const createCampaign = asyncHandler(async (req, res) => {
    const { businessId, campaignName, campaignLanguage, refereeJSON } = req.body;

    try {
        const campaign = await Campaign.create({
            businessId,
            campaignName,
            campaignLanguage,
            refereeJSON
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
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Validate file type
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Only image files are allowed' });
        }

        // Upload the file directly from memory to Cloudinary
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'business',
                public_id: `user_${Date.now()}`,
            },
            (error, result) => {
                if (error) {
                    return res.status(500).json({ message: 'Upload failed' });
                }
                res.json({ url: result.secure_url });
            }
        );

        // Pipe the file buffer into the upload stream
        stream.end(req.file.buffer);
    } catch (error) {
        console.error(error);

        return res.status(500).json({ message: 'An error occurred while uploading the image' });
    }
})

const updateCampaignState = asyncHandler(async(req, res) => {
    const {state, campaignId} = req.body;

    try {
        const campaign  = await Campaign.findById(campaignId);
        if(!campaign){
            return res.status(404).json({message: 'campaign not found'})
        }
        campaign.refereeJSON = state
        const saved = await campaign.save();

        if(saved){
            res.status(200).json(campaign)
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
})

const getCampaignState = asyncHandler(async( req, res ) => {
    const { campaignId } = req.body;

    try {
        const campaign = await Campaign.findById(campaignId);
        if(!campaign){
            return res.status(404).json({message: 'campaign not found'})
        }
        res.status(200).json(campaign.refereeJSON);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
})


module.exports = {
    createCampaign,
    getCampaignsByBusinessId,
    updateCampaignActiveStatus,
    uploadCampaignImage,
    updateCampaignState,
    getCampaignState
};