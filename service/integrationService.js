const axios = require('axios');
const Campaign = require('../models/campaignModel');

const integrationHandlers = {
  zapier: async (campaign, data) => {
    if (!campaign.integrations?.zapier?.isActive || !campaign.integrations.zapier.webhookUrl) {
      return null;
    }
    
    const response = await axios.post(campaign.integrations.zapier.webhookUrl, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  },
  
  pabbly: async (campaign, data) => {
    if (!campaign.integrations?.pabbly?.isActive || !campaign.integrations.pabbly.webhookUrl) {
      return null;
    }
    
    const config = {
      method: campaign.integrations.pabbly.method || 'POST',
      url: campaign.integrations.pabbly.webhookUrl,
      headers: campaign.integrations.pabbly.headers || {},
      data
    };
    
    const response = await axios(config);
    return response.data;
  },
  
  customApi: async (campaign, data) => {
    if (!campaign.integrations?.customApi?.isActive || !campaign.integrations.customApi.endpoint) {
      return null;
    }
    
    let requestData = data;
    if (campaign.integrations.customApi.bodyTemplate) {
      // Implement template processing if needed
      requestData = processTemplate(campaign.integrations.customApi.bodyTemplate, data);
    }
    
    const config = {
      method: campaign.integrations.customApi.method || 'POST',
      url: campaign.integrations.customApi.endpoint,
      headers: campaign.integrations.customApi.headers || {},
      data: requestData
    };
    
    const response = await axios(config);
    return response.data;
  },
  
  webhook: async (campaign, data) => {
    if (!campaign.integrations?.webhook?.isActive || !campaign.integrations.webhook.url) {
      return null;
    }
    
    const config = {
      method: campaign.integrations.webhook.method || 'POST',
      url: campaign.integrations.webhook.url,
      headers: campaign.integrations.webhook.headers || {},
      data
    };
    
    const response = await axios(config);
    return response.data;
  }
};

async function triggerIntegrations(campaignId, data) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new Error('Campaign not found');
  
  const integrationResults = {};
  const activeIntegrations = Object.keys(integrationHandlers)
    .filter(key => campaign.integrations?.[key]?.isActive);
  
  // Process all integrations in parallel
  await Promise.all(activeIntegrations.map(async (integrationName) => {
    try {
      const result = await integrationHandlers[integrationName](campaign, data);
      integrationResults[integrationName] = { success: true, result };
      
      // Update last triggered time
      campaign.integrations[integrationName].lastTriggeredAt = new Date();
    } catch (error) {
      integrationResults[integrationName] = { 
        success: false, 
        error: error.message 
      };
    }
  }));
  
  await campaign.save();
  return integrationResults;
}

module.exports = {
  triggerIntegrations
};