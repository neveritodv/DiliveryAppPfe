const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

const getDB = (req) => req.app.locals.db;

// Get all offers (public)
router.get('/', (req, res) => {
  getDB(req).productsDB.find({ isOffer: true }, (err, docs) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: docs || [] });
  });
});

// Get single offer
router.get('/:id', (req, res) => {
  getDB(req).productsDB.findOne({ _id: req.params.id }, (err, doc) => {
    if (err || !doc) return res.json({ status: '0', message: 'Not found' });
    res.json({ status: '1', payload: doc });
  });
});

module.exports = router;