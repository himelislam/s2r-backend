const mongoose = require("mongoose");

const referrerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    signature: {
        type: String,
        default: null
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId
    },
    qrCodeId: {
        type: Number,
        default: null
    }
})

module.exports = mongoose.model("referrer", referrerSchema);