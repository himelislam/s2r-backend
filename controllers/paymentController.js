const StripeService = require('../service/stripeService');
const Plan = require('../models/plan');
const Business = require('../models/businessModel')
const { mailer: { client_url } } = require('../config/env')

exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const { businessId, planId } = req.body;
    // const businessId = req.user.businessId; // Assuming you have auth middleware

    const session = await StripeService.createCheckoutSession(
      businessId,
      planId,
      `${client_url}/b/dashboard/payment-success`,
      `${client_url}/b/dashboard/payment-cancel`
    );

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.handleSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    console.log(session_id, "session id got")
    const result = await StripeService.handleSuccessfulPayment(session_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBusinessSubscription = async (req, res) => {
  const { businessId } = req.body;
  try {
    const business = await Business.findById(businessId).populate({
      path: 'subscription',
      populate: { path: 'plan' } // Populate the plan inside subscription
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // If subscription exists (even if trial is active), return it
    if (business.subscription) {
      return res.json({ subscription: business.subscription });
    }

    // If no subscription but trial is active, return trial data
    if (new Date() < new Date(business.trialEnd)) {
      return res.json({
        subscription: {
          status: 'trialing',
          plan: { name: 'trial', type: 'trial' },
          currentPeriodEnd: business.trialEnd
        }
      });
    }

    // If no subscription and trial expired, return null (or free plan data)
    res.json({ subscription: null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const { businessId, cancelAtPeriodEnd } = req.body;
    const result = await StripeService.cancelSubscription( businessId, cancelAtPeriodEnd);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};