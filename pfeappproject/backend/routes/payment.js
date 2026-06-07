const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const getDB = (req) => req.app.locals.db;

// Create payment intent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency || 'usd',
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      status: '1',
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    res.json({ status: '0', message: err.message });
  }
});

// Confirm payment
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      const ordersDB = getDB(req).ordersDB;
      ordersDB.update(
        { _id: orderId },
        { $set: { 
          paymentStatus: 'paid',
          paymentIntentId: paymentIntentId,
          paymentMethod: 'stripe',
        }},
        {},
        (err) => {
          if (err) return res.json({ status: '0', message: err.message });
          res.json({ status: '1', message: 'Payment confirmed' });
        }
      );
    } else {
      res.json({ status: '0', message: 'Payment not completed' });
    }
  } catch (err) {
    res.json({ status: '0', message: err.message });
  }
});

// Get publishable key
router.get('/config', auth, (req, res) => {
  res.json({
    status: '1',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
  });
});

module.exports = router;