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
    }
});

const referrerSchema =  new mongoose.Schema({
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
    qrCodeId: {
        type: Number,
        default: null
    },
    referees: {
        type: [refereeSchema],
        default: [],
    }
})

module.exports = mongoose.model("referrer", referrerSchema);