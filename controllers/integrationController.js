const asyncHandler = require('express-async-handler');
const Campaign = require('../models/campaignModel')
const { jwt: { secret } } = require('../config/env');
const { cloudinary } = require('../helpers/cloudinary.helper');
const crypto = require('crypto');
const { default: axios } = require('axios');

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
        console.error(error);
        res.status(500).json({ error: "Failed to save webhook" });
    }
})


const testZapierURL = asyncHandler(async (req, res) => {
    const { campaignId } = req.body; // Changed from req.body to params for RESTful design
    const testPayload = req.body.testData || { // Allow custom test data
        event: 'test_event',
        data: {
            sample: "This is a test payload",
            campaignId,
            timestamp: new Date().toISOString()
        }
    };

    try {
        const campaign = await Campaign.findById(campaignId);
        const zapierConfig = campaign.integrations?.zapier;

        if (!zapierConfig?.webhookUrl) {
            return res.status(400).json({ 
                error: "Zapier webhook URL not configured",
                solution: "Please configure Zapier integration first"
            });
        }

        // 1. Send test payload to Zapier
        const response = await axios.post(zapierConfig.webhookUrl, testPayload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': crypto
                    .createHmac('sha256', zapierConfig.secretKey)
                    .update(JSON.stringify(testPayload))
                    .digest('hex')
            },
            timeout: 5000 // 5 second timeout
        });

        // 2. Verify Zapier response
        if (response.status >= 200 && response.status < 300) {
            // 3. Update campaign status
            await Campaign.findByIdAndUpdate(campaignId, {
                'integrations.zapier.isActive': true,
                'integrations.zapier.lastTestedAt': new Date()
            });

            return res.json({
                status: "success",
                message: "Zapier integration verified successfully!",
                testPayload,
                zapierResponse: response.data
            });
        } else {
            throw new Error(`Zapier responded with status ${response.status}`);
        }
    } catch (error) {
        // Specific error handling
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ 
                error: "Zapier connection timeout",
                solution: "Check your webhook URL and try again" 
            });
        }
        
        if (error.response) {
            // Zapier returned an error response
            return res.status(502).json({
                error: "Zapier rejected the test payload",
                status: error.response.status,
                data: error.response.data
            });
        }

        // Generic error
        res.status(500).json({ 
            error: "Failed to test Zapier integration",
            details: error.message 
        });

        console.error(error);
    }
});










const savePabblyURL = asyncHandler(async (req, res) => {
    const { campaignId, pabblyWebhookUrl } = req.body;

    try {
        await Campaign.findByIdAndUpdate(
            campaignId,
            {
                'integrations.pabbly': {
                    webhookUrl: pabblyWebhookUrl,
                    isActive: false,
                    secretKey: crypto.randomBytes(16).toString('hex')
                }
            }
        );

        res.json({
            success: true,
            message: "Pabbly webhook saved. Send a test from your Pabbly setup to verify."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save webhook" });
    }
})


const testPabblyURL = asyncHandler(async (req, res) => {
    const { campaignId } = req.body; // Changed from req.body to params for RESTful design
    const testPayload = req.body.testData || { // Allow custom test data
        event: 'test_event',
        data: {
            sample: "This is a test payload",
            campaignId,
            timestamp: new Date().toISOString()
        }
    };

    try {
        const campaign = await Campaign.findById(campaignId);
        const pabblyConfig = campaign.integrations?.pabbly;

        if (!pabblyConfig?.webhookUrl) {
            return res.status(400).json({ 
                error: "Pabbly webhook URL not configured",
                solution: "Please configure Pabbly integration first"
            });
        }

        // 1. Send test payload to Pabbly
        const response = await axios.post(pabblyConfig.webhookUrl, testPayload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': crypto
                    .createHmac('sha256', pabblyConfig.secretKey)
                    .update(JSON.stringify(testPayload))
                    .digest('hex')
            },
            timeout: 5000 // 5 second timeout
        });

        // 2. Verify Zapier response
        if (response.status >= 200 && response.status < 300) {
            // 3. Update campaign status
            await Campaign.findByIdAndUpdate(campaignId, {
                'integrations.pabbly.isActive': true,
                'integrations.pabbly.lastTestedAt': new Date()
            });

            return res.json({
                status: "success",
                message: "Pabbly integration verified successfully!",
                testPayload,
                pabblyResponse: response.data
            });
        } else {
            throw new Error(`Pabbly responded with status ${response.status}`);
        }
    } catch (error) {
        // Specific error handling
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ 
                error: "Pabbly connection timeout",
                solution: "Check your webhook URL and try again" 
            });
        }
        
        if (error.response) {
            // Pabbly returned an error response
            return res.status(502).json({
                error: "Pabbly rejected the test payload",
                status: error.response.status,
                data: error.response.data
            });
        }

        // Generic error
        res.status(500).json({ 
            error: "Failed to test Pabbly integration",
            details: error.message 
        });

        console.error(error);
    }
});


module.exports = {
    saveZapierURL,
    testZapierURL,
    savePabblyURL,
    testPabblyURL
}

