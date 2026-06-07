const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

const getDB = (req) => req.app.locals.db;

// Create order
router.post('/', auth, (req, res) => {
  console.log("📝 CREATE ORDER called");
  console.log("📝 User ID:", req.user.id);
  console.log("📝 Body:", req.body);
  
  const ordersDB = getDB(req).ordersDB;
  const order = {
    items: req.body.items,
    total: req.body.total,
    deliveryAddress: req.body.deliveryAddress,
    notes: req.body.notes || '',
    paymentMethod: req.body.paymentMethod || 'cash',
    clientId: req.user.id,
    status: 'pending',
    createdAt: Date.now()
  };
  
  ordersDB.insert(order, (err, doc) => {
    if (err) {
      console.log("❌ INSERT ERROR:", err);
      return res.json({ status: '0', message: err.message });
    }
    console.log("✅ ORDER CREATED:", doc._id);
    res.json({ status: '1', payload: doc });
  });
});

// Get my orders
router.get('/my-orders', auth, (req, res) => {
  console.log("🔍 FETCH ORDERS for user:", req.user.id);
  
  getDB(req).ordersDB.find({ clientId: req.user.id }, (err, docs) => {
    if (err) {
      console.log("❌ FIND ERROR:", err);
      return res.json({ status: '0', message: err.message });
    }
    console.log(`✅ Found ${docs.length} orders`);
    res.json({ status: '1', payload: docs || [] });
  });
});

// Clear order history
router.delete('/clear-history', auth, (req, res) => {
  getDB(req).ordersDB.remove({ clientId: req.user.id }, { multi: true }, (err, numRemoved) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', message: `${numRemoved} orders cleared` });
  });
});

// Get single order
router.get('/:orderId', auth, (req, res) => {
  getDB(req).ordersDB.findOne({ _id: req.params.orderId }, (err, doc) => res.json({ status: '1', payload: doc }));
});

// Cancel order
router.patch('/cancel/:orderId', auth, async (req, res) => {
  const ordersDB = getDB(req).ordersDB;
  const order = await new Promise((resolve, reject) => {
    ordersDB.findOne({ _id: req.params.orderId }, (err, doc) => err ? reject(err) : resolve(doc));
  });
  if (!order) return res.json({ status: '0', message: 'Order not found' });
  if (order.clientId !== req.user.id) return res.status(403).json({ status: '0', message: 'Not your order' });
  if (order.status !== 'pending') return res.json({ status: '0', message: 'Cannot cancel' });
  
  ordersDB.update({ _id: req.params.orderId }, { $set: { status: 'cancelled' } }, {}, (err) => {
    if (err) return res.json({ status: '0', message: err.message });
    const io = req.app.get('io');
    io.to(`order_${req.params.orderId}`).emit('order-status', { status: 'cancelled' });
    res.json({ status: '1' });
  });
});

module.exports = router;