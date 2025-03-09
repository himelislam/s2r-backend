const mongoose = require('mongoose');
const dotenv = require('dotenv'); // For loading environment variables
dotenv.config();

const { mongo: { uri } } = require("../config/env");

// MongoDB connection
mongoose.connect(uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Original Campaign model with array settings
const OriginalCampaignSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    campaignName: {
        type: String,
        required: true,
    },
    campaignLanguage: {
        type: String,
        required: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    stats: {
        totalReach: {
            type: Number,
            default: 0,
        },
        totalUsers: {
            type: Number,
            default: 0,
        },
        totalReferrals: {
            type: Number,
            default: 0,
        },
        convertedReferrals: {
            type: Number,
            default: 0,
        },
    },
    referrerJSON: {
        type: String,
        // required: true,
    },
    refereeJSON: {
        type: String,
        // required: true,
    },
    settings: {
        type: Array,
        // required: true, 
    }
});

// New structured settings schema
const SettingsSchema = new mongoose.Schema({
  startDate: Date,
  endDate: Date,
  language: String,
  domain: {
    useDefaultDomain: Boolean,
    defaultDomain: String,
    customDomain: String
  },
  senderName: String,
  referralLimits: {
    maxReferrals: Number,
    maxRewardsPerUser: Number
  },
  meta: {
    title: String,
    description: String
  },
  pausedCampaignText: String,
  campaignFavicon: String,
  legal: {
    termsAndConditions: String,
    privacyPolicy: String
  },
});

// Original model using array settings
const OriginalCampaign = mongoose.model('Campaign', OriginalCampaignSchema, 'campaigns');

// Create a temporary model for the migration
const TargetCampaignSchema = new mongoose.Schema({
  businessId: mongoose.Schema.Types.ObjectId,
  campaignName: String,
  campaignLanguage: String,
  active: Boolean,
  stats: {
    totalReach: Number,
    totalUsers: Number,
    totalReferrals: Number,
    convertedReferrals: Number
  },
  referrerJSON: String,
  refereeJSON: String,
  settings: SettingsSchema,
  reward: {
    rewardType: String,
    code: String,
    codes: Array,
    amount: Number,
    currency: String
  }
}, { timestamps: true });

const TargetCampaign = mongoose.model('TargetCampaign', TargetCampaignSchema, 'campaigns');

// Function to parse the array settings and convert to structured format
function parseArraySettings(settingsArray) {
  // Create default structured settings
  const structuredSettings = {
    startDate: new Date(),
    endDate: null,
    language: "English",
    domain: {
      useDefaultDomain: true,
      defaultDomain: "attach-n-hatch.vercel.app",
      customDomain: ""
    },
    senderName: "",
    referralLimits: {
      maxReferrals: null,
      maxRewardsPerUser: null
    },
    meta: {
      title: "",
      description: ""
    },
    pausedCampaignText: "This campaign is currently paused.",
    campaignFavicon: "",
    legal: {
      termsAndConditions: "",
      privacyPolicy: ""
    },
  };

  // If no settings array, return defaults
  if (!settingsArray || !Array.isArray(settingsArray)) {
    return structuredSettings;
  }

  // Map array settings to structured settings
  // This mapping depends on your existing data structure
  // You'll need to adjust this logic based on how your settings array is formatted
  settingsArray.forEach(setting => {
    // Example mapping logic - adjust based on your actual data
    if (setting.type === 'startDate') {
      structuredSettings.startDate = new Date(setting.value);
    } 
    else if (setting.type === 'endDate') {
      structuredSettings.endDate = setting.value ? new Date(setting.value) : null;
    }
    else if (setting.type === 'language') {
      structuredSettings.language = setting.value || "English";
    }
    else if (setting.type === 'domain') {
      if (typeof setting.value === 'object') {
        structuredSettings.domain = {
          ...structuredSettings.domain,
          ...setting.value
        };
      }
    }
    else if (setting.type === 'senderName') {
      structuredSettings.senderName = setting.value || "";
    }
    else if (setting.type === 'referralLimits') {
      if (typeof setting.value === 'object') {
        structuredSettings.referralLimits = {
          ...structuredSettings.referralLimits,
          ...setting.value
        };
      }
    }
    else if (setting.type === 'meta') {
      if (typeof setting.value === 'object') {
        structuredSettings.meta = {
          ...structuredSettings.meta,
          ...setting.value
        };
      }
    }
    else if (setting.type === 'pausedCampaignText') {
      structuredSettings.pausedCampaignText = setting.value || "This campaign is currently paused.";
    }
    else if (setting.type === 'campaignFavicon') {
      structuredSettings.campaignFavicon = setting.value || "";
    }
    else if (setting.type === 'termsAndConditions') {
      structuredSettings.legal.termsAndConditions = setting.value || "";
    }
    else if (setting.type === 'privacyPolicy') {
      structuredSettings.legal.privacyPolicy = setting.value || "";
    }
    else {
      // Store any other settings in additionalSettings
      structuredSettings.additionalSettings.set(setting.type, setting.value);
    }
  });

  return structuredSettings;
}

// Main migration function
async function migrateSettings() {
  try {
    // Get all campaigns
    const campaigns = await OriginalCampaign.find({});
    console.log(`Found ${campaigns.length} campaigns to migrate`);

    let successCount = 0;
    let errorCount = 0;

    // Process each campaign
    for (const campaign of campaigns) {
      try {
        // Convert array settings to structured format
        const structuredSettings = parseArraySettings(campaign.settings);
        
        // Update the campaign with new settings format
        await TargetCampaign.findByIdAndUpdate(
          campaign._id, 
          { $set: { settings: structuredSettings } },
          { new: true, runValidators: false }
        );
        
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`Migrated ${successCount} campaigns`);
        }
      } catch (err) {
        errorCount++;
        console.error(`Error migrating campaign ${campaign._id}:`, err);
      }
    }

    console.log(`Migration complete. Successfully migrated: ${successCount}, Errors: ${errorCount}`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateSettings().then(() => {
  console.log('Migration script finished');
  process.exit(0);
}).catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});