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
    const business = await Business.findById(businessId).populate('subscription');
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    let subscription = business.subscription;
    if (!subscription && new Date() < new Date(business.trialEnd)) {
      // Return trial information
      subscription = {
        status: 'trialing',
        plan: { name: 'trial', type: 'trial' },
        currentPeriodEnd: business.trialEnd
      };
    }

    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};