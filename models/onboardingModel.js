const mongoose = require("mongoose");

const onboardingSchema = new mongoose.Schema({
  businessType: {
    type: String,
    enum: ["E-commerce", "Service-based", "SaaS", "Agency", "Personal brand", "Other"],
    required: true
  },
  hearAboutUs: {
    type: String,
    enum: ["Google", "YouTube", "Friend or colleague", "Social Media", "Newsletter", "Other"],
    required: true
  },
  role: {
    type: String,
    enum: ["Founder", "Marketer", "Developer", "Designer", "Operations", "Other"],
    required: true
  },
  additionalInfo: {
    type: String,
    default: ""
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  metadata: {
    ipAddress: String,
    userAgent: String
  }
});

// Add indexes for better query performance
onboardingSchema.index({ business: 1 });
onboardingSchema.index({ submissionDate: -1 });

module.exports = mongoose.model("Onboarding", onboardingSchema);