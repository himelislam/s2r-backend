const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
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
    referrerJson: {
        type: String,
        // required: true,
    },
    refereeJson: {
        type: String,
        // required: true,
    },
    settings: {
        type: Array,
        // required: true, 
    },
})

module.exports = mongoose.model("Campaign", campaignSchema);