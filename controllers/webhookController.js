const StripeService = require('../service/stripeService');
const Business = require('../models/businessModel');
const Subscription = require('../models/subscription');

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await StripeService.handleSuccessfulPayment(event.data.object.id);
        break;

      case 'invoice.payment_succeeded':
        if (event.data.object.billing_reason === 'subscription_create') {
          // Initial subscription payment succeeded
          const subscriptionId = event.data.object.subscription;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          await Subscription.updateOne(
            { stripeSubscriptionId: subscriptionId },
            {
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            }
          );
        }
        break;

      case 'invoice.payment_failed':
        const subscriptionId = event.data.object.subscription;
        await Subscription.updateOne(
          { stripeSubscriptionId: subscriptionId },
          { status: 'past_due' }
        );
        break;

      case 'customer.subscription.deleted':
        await Subscription.updateOne(
          { stripeSubscriptionId: event.data.object.id },
          { status: 'canceled' }
        );
        break;

      case 'customer.subscription.updated':
        const sub = event.data.object;
        await Subscription.updateOne(
          { stripeSubscriptionId: sub.id },
          {
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end
          }
        );
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
};