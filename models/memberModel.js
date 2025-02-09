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
        enum: ['Invited', 'Active']
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
})

module.exports = mongoose.model("Member", memberSchema);