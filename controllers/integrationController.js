const asyncHandler = require('express-async-handler');
const Campaign = require('../models/campaignModel')
const { jwt: { secret } } = require('../config/env');
const { cloudinary } = require('../helpers/cloudinary.helper');


const saveZapierURL = asyncHandler(async (req, res) => {
    const { campaignId, zapierWebhookUrl } = req.body;

    try {
        await Campaign.findByIdAndUpdate(
            campaignId,
            {
                'integrations.zapier': {
                    webhookUrl: zapierWebhookUrl,
                    isActive: false,
                    secretKey: crypto.randomBytes(16).toString('hex')
                }
            }
        );

        res.json({
            success: true,
            message: "Zapier webhook saved. Send a test from your Zapier setup to verify."
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to save webhook" });
    }
})



const testZapierURL = asyncHandler(async (req, res) => {
    const { campaignId } = req.body;

    try {
        const campaign = await Campaign.findById(campaignId);
        const zapierConfig = campaign.integrations?.zapier;

        if (!zapierConfig) {
            return res.status(404).json({ error: "Zapier not configured" });
        }

        // Mark as active (Zapier will call this after user pastes URL)
        await Campaign.updateOne(
            { _id: req.params.campaignId },
            { 'integrations.zapier.isActive': true }
        );

        res.json({
            status: "ready",
            message: "Zapier integration is now active!",
            testData: {
                event: 'test_event',
                data: { sample: "This is a test payload" }
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to test zapier" });
    }
})




const sendToZapier = async (campaignId, formData) => {
    const campaign = await Campaign.findById(campaignId);
    const zapierConfig = campaign.integrations?.zapier;

    if (!zapierConfig?.webhookUrl) return;

    try {
        await axios.post(zapierConfig.webhookUrl, {
            event: 'form_submitted',
            data: formData,
            timestamp: new Date().toISOString()
        }, {
            headers: {
                'X-Signature': crypto
                    .createHmac('sha256', zapierConfig.secretKey)
                    .update(JSON.stringify(formData))
                    .digest('hex')
            }
        });
    } catch (error) {
        console.error('Zapier delivery failed:', error);
    }
}

module.exports = {
    saveZapierURL,
    sendToZapier,
    testZapierURL
}

