const express = require('express');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const getDB = (req) => req.app.locals.db;
router.use(auth, roleCheck('admin'));

// Orders
router.get('/orders/all', (req, res) => {
  getDB(req).ordersDB.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: docs });
  });
});

// Stats (last 7 days)
router.get('/stats', (req, res) => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  getDB(req).ordersDB.find({ createdAt: { $gte: sevenDaysAgo } }, (err, docs) => {
    if (err) return res.json([]);
    const grouped = {};
    docs.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = { count: 0, total: 0 };
      grouped[date].count++;
      grouped[date].total += order.total || 0;
    });
    const stats = Object.entries(grouped).map(([date, data]) => ({ date, count: data.count, total: data.total }));
    stats.sort((a,b) => a.date.localeCompare(b.date));
    res.json(stats);
  });
});

// Restaurants CRUD
router.get('/restaurants', (req, res) => {
  getDB(req).restaurantsDB.find({}, (err, docs) => res.json({ status: '1', payload: docs }));
});
router.post('/restaurants', (req, res) => {
  getDB(req).restaurantsDB.insert(req.body, (err, doc) => res.json({ status: '1', payload: doc }));
});
router.put('/restaurants/:id', (req, res) => {
  const db = getDB(req).restaurantsDB;
  db.update({ _id: req.params.id }, { $set: req.body }, {}, (err) => {
    db.findOne({ _id: req.params.id }, (err2, doc) => res.json({ status: '1', payload: doc }));
  });
});
router.delete('/restaurants/:id', (req, res) => {
  getDB(req).restaurantsDB.remove({ _id: req.params.id }, {}, (err) => res.json({ status: '1' }));
});

// Products CRUD
router.get('/products', (req, res) => {
  getDB(req).productsDB.find({}, (err, docs) => res.json({ status: '1', payload: docs }));
});
router.post('/products', (req, res) => {
  getDB(req).productsDB.insert(req.body, (err, doc) => res.json({ status: '1', payload: doc }));
});
router.put('/products/:id', (req, res) => {
  const db = getDB(req).productsDB;
  db.update({ _id: req.params.id }, { $set: req.body }, {}, (err) => {
    db.findOne({ _id: req.params.id }, (err2, doc) => res.json({ status: '1', payload: doc }));
  });
});
router.delete('/products/:id', (req, res) => {
  getDB(req).productsDB.remove({ _id: req.params.id }, {}, (err) => res.json({ status: '1' }));
});

// Delivery staff
router.get('/delivery-staff', (req, res) => {
  getDB(req).usersDB.find({ role: 'delivery' }, (err, docs) => res.json({ status: '1', payload: docs }));
});

// Update delivery staff
router.put('/delivery-staff/:id', async (req, res) => {
  const { name, mobile, password } = req.body;
  const update = { name, mobile };
  if (password) {
    const bcrypt = require('bcrypt');
    update.password = await bcrypt.hash(password, 10);
  }
  getDB(req).usersDB.update({ _id: req.params.id, role: 'delivery' }, { $set: update }, {}, (err) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1' });
  });
});

// Delete delivery staff
router.delete('/delivery-staff/:id', async (req, res) => {
  getDB(req).usersDB.remove({ _id: req.params.id, role: 'delivery' }, {}, (err) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1' });
  });
});

// Avatar upload for delivery staff
const uploadsDir = path.join(__dirname, '..', 'uploads');
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, 'staff_' + req.params.id + path.extname(file.originalname))
});
const uploadAvatar = multer({ storage: avatarStorage });

router.post('/delivery-staff/:id/avatar', uploadAvatar.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ status: '0', message: 'No file uploaded' });
  const avatarUrl = `/uploads/${req.file.filename}`;
  const usersDB = getDB(req).usersDB;
  usersDB.update({ _id: req.params.id, role: 'delivery' }, { $set: { avatar: avatarUrl } }, {}, (err) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', avatarUrl });
  });
});

// Remove avatar for delivery staff
router.delete('/delivery-staff/:id/avatar', async (req, res) => {
  const usersDB = getDB(req).usersDB;
  usersDB.update({ _id: req.params.id, role: 'delivery' }, { $set: { avatar: null } }, {}, (err) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1' });
  });
});

// Get all users (for admin to start a chat with anyone)
router.get('/users', (req, res) => {
  getDB(req).usersDB.find({}, (err, docs) => {
    if (err) return res.json({ status: '0', message: err.message });
    // remove passwords for security
    const safeDocs = docs.map(({ password, ...rest }) => rest);
    res.json({ status: '1', payload: safeDocs });
  });
});

// Get a single user by ID (for chat other participant info)
router.get('/users/:userId', (req, res) => {
  getDB(req).usersDB.findOne({ _id: req.params.userId }, (err, user) => { 
    if (err) return res.json({ status: '0', message: err.message });
    if (!user) return res.json({ status: '0', message: 'User not found' });
    const { password, ...safeUser } = user;
    res.json({ status: '1', payload: safeUser });
  });
});

module.exports = router;