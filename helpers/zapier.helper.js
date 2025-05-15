const Campaign = require("../models/campaignModel");

async function sendToZapier(campaignId, data) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || !campaign.integrations?.zapier?.webhookUrl) {
        throw new Error('Zapier integration not properly configured');
    }

    const response = await fetch(campaign.integrations.zapier.webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Include any authentication headers if needed
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Zapier webhook failed with status ${response.status}`);
    }

    return response.json();
}

module.exports = {
    sendToZapier
}