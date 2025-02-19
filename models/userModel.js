const mongoose = require("mongoose");

const userSchema =  new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    url: {
        type: String,
    },
    password: {
        type: String,
        // required: true,
    },
    userType: {
        type: String,
        enum: ['user', 'owner', 'referrer'],
        default: 'user'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId
    },
    resetToken: { 
        type: String,
        default: null 
    },
    resetTokenExpiration: { 
        type: Date ,
        default: null
    },
})

module.exports = mongoose.model("User", userSchema);