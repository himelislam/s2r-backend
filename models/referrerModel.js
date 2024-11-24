const mongoose = require("mongoose");

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
        type: String
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId
    }
})

module.exports = mongoose.model("referrer", referrerSchema);