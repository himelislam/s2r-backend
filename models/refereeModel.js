const mongoose = require("mongoose");


const refereeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        default: null
    },
    phone:{
        type: Number,
        default: null
    },
    date: {
        type: Date,
        required: true,
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId
    },
    referrerId:{
        type: mongoose.Schema.Types.ObjectId
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId
    },
    status: {
        type: String,
        enum: ['Pending', 'Active'],
        default: 'Pending'
    }
});


module.exports = mongoose.model("referee", refereeSchema);