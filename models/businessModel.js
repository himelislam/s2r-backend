const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    referrerId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    referrerName:{
        type: String,
        default: null
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

const businessSchema =  new mongoose.Schema({
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
    }
})

module.exports = mongoose.model("business", businessSchema);
// module.exports = mongoose.model("qrcode", qrCodeSchema);