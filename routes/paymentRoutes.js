const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const webhookController = require('../controllers/webhookController');
const { requireAuth, authMiddleware } = require('../middlewares/authMiddleware');
const { requireSubscription } = require('../middlewares/subscriptionMiddleware');

// Public routes
router.post('/webhook', express.raw({ type: 'application/json' }), webhookController.handleWebhook);

// Protected routes
// router.use(requireAuth);
router.use(authMiddleware);

// Get available plans
router.get('/plans', paymentController.getPlans);

// Create checkout session
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// Handle successful payment
router.post('/success', paymentController.handleSuccess);

// Get business subscription status
router.post('/subscription', paymentController.getBusinessSubscription);

module.exports = router;