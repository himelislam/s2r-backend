const stripe = require('../config/stripe');
const Plan = require('../models/plan');
const Business = require('../models/businessModel');
const Subscription = require('../models/subscription');

class StripeService {
  // Initialize Stripe products and plans
  static async initializePlans() {
    const plans = [
      {
        name: 'starter',
        type: 'monthly',
        price: 1999, // $19.99
        features: ['Up to 10 referrers', '5 active campaigns', 'Basic analytics'],
        limits: { qrCodes: 50, referrers: 10, campaigns: 5, payouts: 20 }
      },
      {
        name: 'starter',
        type: 'yearly',
        price: 19900, // $199.00 (save ~16%)
        features: ['Up to 10 referrers', '5 active campaigns', 'Basic analytics'],
        limits: { qrCodes: 50, referrers: 10, campaigns: 5, payouts: 20 }
      },
      {
        name: 'starter',
        type: 'lifetime',
        price: 49900, // $499.00 one-time
        features: ['Up to 10 referrers', '5 active campaigns', 'Basic analytics'],
        limits: { qrCodes: 50, referrers: 10, campaigns: 5, payouts: 20 }
      },
      {
        name: 'premium',
        type: 'monthly',
        price: 4999, // $49.99
        features: ['Unlimited referrers', '20 active campaigns', 'Advanced analytics', 'Priority support'],
        limits: { qrCodes: 500, referrers: -1, campaigns: 20, payouts: -1 }
      },
      {
        name: 'premium',
        type: 'yearly',
        price: 49900, // $499.00 (save ~16%)
        features: ['Unlimited referrers', '20 active campaigns', 'Advanced analytics', 'Priority support'],
        limits: { qrCodes: 500, referrers: -1, campaigns: 20, payouts: -1 }
      },
      {
        name: 'premium',
        type: 'lifetime',
        price: 99900, // $999.00 one-time
        features: ['Unlimited referrers', '20 active campaigns', 'Advanced analytics', 'Priority support'],
        limits: { qrCodes: 500, referrers: -1, campaigns: 20, payouts: -1 }
      }
    ];

    // Create or update plans in Stripe and our database
    for (const planData of plans) {
      // Check if we already have this plan in our database
      const existingPlan = await Plan.findOne({
        name: planData.name,
        type: planData.type
      });

      // If plan exists in DB, check if price changed
      if (existingPlan) {
        // Get the Stripe price to compare
        try {
          const stripePrice = await stripe.prices.retrieve(existingPlan.stripePriceId);

          // If price hasn't changed, skip updating
          if (stripePrice.unit_amount === planData.price) {
            continue;
          }

          // Price changed - create new price and deactivate old one
          await stripe.prices.update(existingPlan.stripePriceId, {
            active: false
          });
        } catch (err) {
          // Price might have been deleted in Stripe, we'll create new one
          console.log(`Price ${existingPlan.stripePriceId} not found, creating new`);
        }
      }

      // Find or create product in Stripe
      let stripeProduct;
      const products = await stripe.products.search({
        query: `name:"${planData.name}" AND active:'true'`
      });

      if (products.data.length > 0) {
        stripeProduct = products.data[0];
      } else {
        stripeProduct = await stripe.products.create({
          name: `${planData.name.charAt(0).toUpperCase() + planData.name.slice(1)} Plan`,
          description: planData.features.join(', '),
          metadata: {
            planName: planData.name,
            planType: planData.type
          }
        });
      }

      // Create new price
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: planData.price,
        currency: 'usd',
        recurring: planData.type !== 'lifetime' ? {
          interval: planData.type === 'yearly' ? 'year' : 'month'
        } : undefined,
        metadata: {
          planName: planData.name,
          planType: planData.type
        }
      });

      // Upsert plan in database
      await Plan.findOneAndUpdate(
        { name: planData.name, type: planData.type },
        {
          ...planData,
          stripePriceId: stripePrice.id,
          isActive: true
        },
        { upsert: true, new: true }
      );
    }

    console.log('Stripe plans initialized/verified successfully');
  }


  static async createCheckoutSession(businessId, planId, successUrl, cancelUrl) {
    const business = await Business.findById(businessId);
    const plan = await Plan.findById(planId);

    if (!business || !plan) {
      throw new Error('Business or plan not found');
    }

    // Create or retrieve Stripe customer
    let customerId = business.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: business.email,
        name: business.businessName,
        metadata: {
          businessId: business._id.toString()
        }
      });
      customerId = customer.id;
      business.stripeCustomerId = customerId;
      await business.save();
    }

    const sessionParams = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: plan.stripePriceId,
        quantity: 1,
      }],
      mode: plan.type === 'lifetime' ? 'payment' : 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        businessId: business._id.toString(),
        planId: plan._id.toString(),
        planType: plan.type // Add plan type to metadata
      }
    };

    // For subscriptions (not one-time payments)
    if (plan.type !== 'lifetime') {
      sessionParams.subscription_data = {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          businessId: business._id.toString(),
          planId: plan._id.toString()
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return session;
  }


  static async handleSuccessfulPayment(sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer']
      });

      // Validate metadata
      if (!session.metadata?.businessId || !session.metadata?.planId) {
        throw new Error("Missing businessId or planId in session metadata");
      }

      const business = await Business.findById(session.metadata.businessId);
      const plan = await Plan.findById(session.metadata.planId);

      if (!business || !plan) {
        throw new Error('Business or plan not found');
      }

      let subscription;

      // For subscriptions (monthly/yearly)
      if (session.subscription) {
        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription.id);

        const currentPeriodStart = stripeSubscription.current_period_start
          ? new Date(stripeSubscription.current_period_start * 1000)
          : new Date();

        const currentPeriodEnd = stripeSubscription.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000)
          : new Date(new Date().setFullYear(new Date().getFullYear() + 1)); // Default: 1 year later

        subscription = await Subscription.create({
          business: business._id,
          plan: plan._id,
          status: stripeSubscription.status,
          stripeSubscriptionId: stripeSubscription.id,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false
        });

        business.subscription = subscription._id;
        await business.save();
      }
      // For one-time payments (LTD)
      else if (session.payment_status === 'paid') {
        subscription = await Subscription.create({
          business: business._id,
          plan: plan._id,
          status: 'active',
          stripeSubscriptionId: `one-time-${session.id}`,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date('2100-01-01') // Far future for LTD
        });

        business.subscription = subscription._id;
        await business.save();
      }

      // Populate subscription with plan before returning
      const updatedBusiness = await Business.findById(business._id)
        .populate({
          path: 'subscription',
          populate: { path: 'plan' }
        });

      return {
        // subscription: updatedBusiness.subscription,
        // plan

        subscription: {
          ...updatedBusiness.subscription.toObject(), // Convert Mongoose doc to plain object
          plan: plan // Include the full plan details
        }
      };
    } catch (error) {
      console.error("Error in handleSuccessfulPayment:", error);
      throw error;
    }
  }
}

module.exports = StripeService;