const mongoose = require("mongoose");
require('./subscription')

const qrCodeSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    referrerId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    referrerName: {
        type: String,
        default: null
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    url: {
        type: String,
        required: true,
    },
    qrCodeBase64: {
        type: String,   // as base64 image
        required: true,
    },
    generationDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['unassigned', 'assigned'],
        default: 'unassigned'
    }
});

const businessSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    url: {
        type: String,
    },
    businessEmail: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    qrCodes: {
        type: [qrCodeSchema],
        default: [],
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    stripeCustomerId: String,
    trialEnd: {
        type: Date,
        default: function () {
            // 14-day free trial
            const trialPeriod = new Date();
            trialPeriod.setDate(trialPeriod.getDate() + 14);
            return trialPeriod;
        }
    },
})

module.exports = mongoose.model("business", businessSchema);
// module.exports = mongoose.model("qrcode", qrCodeSchema);