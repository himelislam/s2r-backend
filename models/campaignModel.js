const mongoose = require("mongoose");

// Define nested schemas for better structure
const StatsSchema = new mongoose.Schema({
  totalReach: {
    type: Number,
    default: 0
  },
  totalUsers: {
    type: Number,
    default: 0
  },
  totalReferrals: {
    type: Number,
    default: 0
  },
  convertedReferrals: {
    type: Number,
    default: 0
  }
});

const RewardSchema = new mongoose.Schema({
  rewardType: {
    type: String,
    enum: ['COUPON', 'GIFTCARD', 'CASH']
  },
  code: String,
  codes: [String], // Changed Array to [String] for better type definition
  amount: Number,
  currency: String
});

const SettingsSchema = new mongoose.Schema({
    // Duration and Language
    startDate: {
      type: Date,
      required: false
    },
    endDate: {
      type: Date,
      required: false
    },
    language: {
      type: String,
      default: "English"
    },
    
    // Domain Used For Links
    domain: {
      useDefaultDomain: {
        type: Boolean,
        default: true
      },
      defaultDomain: {
        type: String,
        default: "referral-factory.com"
      },
      customDomain: {
        type: String
      }
    },
    
    // Email Notifications
    senderName: {
      type: String
    },
    
    // Referral Limits
    referralLimits: {
      maxReferrals: {
        type: Number,
        default: null // null means unlimited
      },
      maxRewardsPerUser: {
        type: Number,
        default: null // null means unlimited
      }
    },
    
    // Meta Information
    meta: {
      title: {
        type: String
      },
      description: {
        type: String
      }
    },
    
    // Campaign Status Messages
    pausedCampaignText: {
      type: String,
      default: "This campaign is currently paused."
    },
    
    // Visual Elements
    campaignFavicon: {
      type: String // URL to the favicon
    },
    
    // Legal Documents
    legal: {
      termsAndConditions: {
        type: String,
        maxlength: 50000
      },
      privacyPolicy: {
        type: String,
        maxlength: 50000
      }
    },
    
    // Any additional custom settings
    // additionalSettings: {
    //   type: Map,
    //   of: Schema.Types.Mixed
    // }
  });

// Main schema
const CampaignSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business', // Added ref for proper relation
    required: true
  },
  campaignName: {
    type: String,
    required: true,
    trim: true // Trims whitespace
  },
  campaignLanguage: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  stats: {
    type: StatsSchema,
    default: () => ({}) // Proper way to set default for an object
  },
  referrerJSON: String, // Simplified since not required
  refereeJSON: String, // Simplified since not required
  settings: {
    type: SettingsSchema,
    default: () => ({})
  },
  reward: {
    type: RewardSchema,
    default: () => ({})
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Adding indexes for common query fields
CampaignSchema.index({ businessId: 1 });
CampaignSchema.index({ campaignName: 1 });
CampaignSchema.index({ active: 1 });

module.exports = mongoose.model("Campaign", CampaignSchema);