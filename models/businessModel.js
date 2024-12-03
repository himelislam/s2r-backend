const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    qrCode: {
        type: String,   // as base64 image
        required: true,
    },
    generationDate: {
        type: Date,
        default: Date.now,
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
module.exports = mongoose.model("qrcode", qrCodeSchema);