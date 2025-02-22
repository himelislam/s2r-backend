const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Invited', 'Active', 'Created']
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    qrCode:{
        type: Object,
        required: false
    },
    campaignName: {
        type: String,
        required: false
    },
})

module.exports = mongoose.model("Member", memberSchema);