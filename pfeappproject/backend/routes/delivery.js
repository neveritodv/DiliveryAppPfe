const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

const getDB = (req) => req.app.locals.db;

router.get('/available-orders', auth, (req, res) => {
  if (req.user.role !== 'delivery') return res.status(403).json({ status: '0', message: 'Forbidden' });
  getDB(req).ordersDB.find({ status: 'pending' }, (err, docs) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: docs });
  });
});

router.post('/accept/:orderId', auth, (req, res) => {
  const ordersDB = getDB(req).ordersDB;
  const chatsDB = getDB(req).chatsDB;
  
  ordersDB.findOne({ _id: req.params.orderId, status: 'pending' }, (err, order) => {
    if (err || !order) return res.json({ status: '0', message: 'Order not found' });
    
    ordersDB.update(
      { _id: req.params.orderId },
      { $set: { status: 'accepted', deliveryPersonId: req.user.id } },
      {},
      (err) => {
        if (err) return res.json({ status: '0', message: err.message });
        
        const io = req.app.get('io');
        io.to(`order_${req.params.orderId}`).emit('order-status', { status: 'accepted' });
        
        const participants = [req.user.id, order.clientId].sort();
        chatsDB.findOne({ participants }, (err, existing) => {
          if (err) return res.json({ status: '0', message: err.message });
          if (!existing) {
            chatsDB.insert({ participants, createdAt: Date.now(), updatedAt: Date.now() }, (err) => {
              if (err) console.error('Failed to create chat', err);
            });
          }
        });
        res.json({ status: '1' });
      }
    );
  });
});

router.post('/refuse/:orderId', auth, (req, res) => {
  if (req.user.role !== 'delivery') return res.status(403).json({ status: '0', message: 'Forbidden' });
  
  const ordersDB = getDB(req).ordersDB;
  ordersDB.update(
    { _id: req.params.orderId },
    { $set: { status: 'refused' } },
    {},
    (err) => {
      if (err) return res.json({ status: '0', message: err.message });
      // Optionally emit a socket event if needed
      res.json({ status: '1' });
    }
  );
});

// Add this route for active orders (accepted, picked_up, on_the_way)
router.get('/active-orders', auth, (req, res) => {
  if (req.user.role !== 'delivery') return res.status(403).json({ status: '0', message: 'Forbidden' });
  
  getDB(req).ordersDB.find({ 
    deliveryPersonId: req.user.id,
    status: { $in: ['accepted', 'picked_up', 'on_the_way'] }
  }, (err, docs) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: docs });
  });
});

router.patch('/update-status/:orderId', auth, (req, res) => {
  const { status } = req.body;
  const ordersDB = getDB(req).ordersDB;
  ordersDB.update(
    { _id: req.params.orderId },
    { $set: { status } },
    {},
    (err) => {
      if (err) return res.json({ status: '0', message: err.message });
      const io = req.app.get('io');
      io.to(`order_${req.params.orderId}`).emit('order-status', { status });
      res.json({ status: '1' });
    }
  );
});

router.patch('/cancel/:orderId', auth, async (req, res) => {
  if (req.user.role !== 'delivery') return res.status(403).json({ status: '0', message: 'Forbidden' });
  const ordersDB = getDB(req).ordersDB;
  const order = await new Promise((resolve, reject) => {
    ordersDB.findOne({ _id: req.params.orderId }, (err, doc) => err ? reject(err) : resolve(doc));
  });
  if (!order) return res.json({ status: '0', message: 'Order not found' });
  if (order.deliveryPersonId !== req.user.id) return res.status(403).json({ status: '0', message: 'Not your order' });
  if (order.status !== 'accepted') return res.json({ status: '0', message: 'Can only cancel accepted orders' });
  
  ordersDB.update({ _id: req.params.orderId }, { $set: { status: 'cancelled' } }, {}, (err) => {
    if (err) return res.json({ status: '0', message: err.message });
    const io = req.app.get('io');
    io.to(`order_${req.params.orderId}`).emit('order-status', { status: 'cancelled' });
    res.json({ status: '1' });
  });
});

router.get('/history', auth, (req, res) => {
  if (req.user.role !== 'delivery') return res.status(403).json({ status: '0' });
  getDB(req).ordersDB.find({ deliveryPersonId: req.user.id, status: 'delivered' }, (err, docs) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: docs });
  });
});

module.exports = router;