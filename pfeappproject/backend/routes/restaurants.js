const express = require('express');
const router = express.Router();

const getDB = (req) => req.app.locals.db;

// Get all restaurants
router.get('/', (req, res) => {
  getDB(req).restaurantsDB.find({}, (err, docs) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: docs || [] });
  });
});

// Get popular restaurants
router.get('/popular', (req, res) => {
  getDB(req).restaurantsDB.find({ isPopular: true }, (err, docs) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: docs || [] });
  });
});

// Get single restaurant
router.get('/:id', (req, res) => {
  getDB(req).restaurantsDB.findOne({ _id: req.params.id }, (err, doc) => {
    if (err || !doc) return res.json({ status: '0', message: 'Not found' });
    res.json({ status: '1', payload: doc });
  });
});

module.exports = router;