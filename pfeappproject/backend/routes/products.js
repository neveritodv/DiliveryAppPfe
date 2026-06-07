const router = require('express').Router();
const getDB = (req) => req.app.locals.db;

// Public GET – no authentication required
router.get('/', (req, res) => {
  getDB(req).productsDB.find({}, (err, docs) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: docs });
  });
});

module.exports = router;