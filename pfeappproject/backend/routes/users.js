const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ status: "0" });
  const { role } = req.query;
  let query = {};
  if (role) query.role = role;
  const users = await User.find(query).select('-password');
  res.json({ status: "1", payload: users });
});

module.exports = router;