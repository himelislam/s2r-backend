const Business = require('../models/businessModel');
const Plan = require('../models/plan');

// Middleware to check if business has active subscription or trial
exports.requireSubscription = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.businessId).populate('subscription');
    
    // Check if business has active subscription
    if (business.subscription && ['active', 'trialing'].includes(business.subscription.status)) {
      return next();
    }

    // Check if business is in trial period
    if (new Date() < new Date(business.trialEnd)) {
      return next();
    }

    // No active subscription or trial
    res.status(403).json({
      error: 'Subscription required',
      message: 'You need an active subscription to access this feature'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Middleware to check feature access based on plan
exports.checkPlanLimits = (feature) => async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.businessId)
      .populate('subscription')
      .populate({
        path: 'subscription',
        populate: { path: 'plan' }
      });

    // Free trial access
    if (!business.subscription && new Date() < new Date(business.trialEnd)) {
      // Apply trial limits
      const trialLimits = {
        qrCodes: 10,
        referrers: 3,
        campaigns: 1,
        payouts: 5
      };

      // Check if feature is allowed in trial
      if (trialLimits[feature] === 0) {
        return res.status(403).json({
          error: 'Feature not available',
          message: 'This feature is not available during trial period'
        });
      }

      // Check usage against trial limits
      const usage = await getFeatureUsage(business._id, feature);
      if (usage >= trialLimits[feature]) {
        return res.status(403).json({
          error: 'Trial limit reached',
          message: `You've reached the trial limit for this feature. Please upgrade to continue.`
        });
      }

      return next();
    }

    // Free plan access (no subscription)
    if (!business.subscription) {
      const freeLimits = {
        qrCodes: 5,
        referrers: 1,
        campaigns: 1,
        payouts: 3
      };

      if (freeLimits[feature] === 0) {
        return res.status(403).json({
          error: 'Feature not available',
          message: 'This feature requires a subscription'
        });
      }

      const usage = await getFeatureUsage(business._id, feature);
      if (usage >= freeLimits[feature]) {
        return res.status(403).json({
          error: 'Free plan limit reached',
          message: `You've reached the free plan limit for this feature. Please upgrade to continue.`
        });
      }

      return next();
    }

    // Paid plan access
    const plan = business.subscription.plan;
    if (plan.limits[feature] === -1) { // -1 means unlimited
      return next();
    }

    const usage = await getFeatureUsage(business._id, feature);
    if (usage >= plan.limits[feature]) {
      return res.status(403).json({
        error: 'Plan limit reached',
        message: `You've reached your plan limit for this feature. Please upgrade to continue.`
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function getFeatureUsage(businessId, feature) {
  // Implement logic to get current usage for the feature
  // This will depend on your specific models and business logic
  // Example:
  switch (feature) {
    case 'qrCodes':
      return QRCode.countDocuments({ businessId });
    case 'referrers':
      return Referrer.countDocuments({ businessId });
    case 'campaigns':
      return Campaign.countDocuments({ businessId });
    case 'payouts':
      return Payout.countDocuments({ businessId });
    default:
      return 0;
  }
}