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
    referrerName:{
        type: String,
        required: true
    }
});


module.exports = mongoose.model("referee", refereeSchema);