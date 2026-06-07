const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

const getDB = (req) => req.app.locals.db;

// Helper to sort participants (for chat creation)
function getSortedParticipants(userId1, userId2) {
  return [userId1, userId2].sort();
}

// Client reports a delivery person
router.post('/', auth, async (req, res) => {
  const { orderId, deliveryPersonId, reason, description } = req.body;
  const reportsDB = getDB(req).reportsDB;
  const report = { 
    clientId: req.user.id, 
    orderId, 
    deliveryPersonId, 
    reason, 
    description, 
    status: 'pending', 
    createdAt: Date.now() 
  };
  reportsDB.insert(report, (err, doc) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: doc });
  });
});

// Get reports submitted by the current user (client)
router.get('/my-reports', auth, (req, res) => {
  getDB(req).reportsDB.find({ clientId: req.user.id }, (err, docs) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: docs });
  });
});

// Get a single report by ID (client only)
router.get('/client/:reportId', auth, (req, res) => {
  getDB(req).reportsDB.findOne({ _id: req.params.reportId, clientId: req.user.id }, (err, doc) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: doc });
  });
});

// Admin: get all reports
router.get('/admin/all', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ status: '0' });
  getDB(req).reportsDB.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: docs });
  });
});

// Admin: accept report – creates a chat between client and admin
router.patch('/admin/:reportId/accept', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ status: '0' });
  const reportsDB = getDB(req).reportsDB;
  const chatsDB = getDB(req).chatsDB;
  
  reportsDB.findOne({ _id: req.params.reportId }, (err, report) => {
    if (err || !report) return res.json({ status: '0', message: 'Report not found' });
    
    // Update report status to 'accepted'
    reportsDB.update({ _id: req.params.reportId }, { $set: { status: 'accepted' } }, {}, (err) => {
      if (err) return res.json({ status: '0', message: err.message });
      
      // Find existing chat (NeDB does not support $all, so we do two steps)
      chatsDB.find({ participants: report.clientId }, (err, docs) => {
        if (err) return res.json({ status: '0', message: err.message });
        const existingChat = docs.find(doc => doc.participants.includes(req.user.id));
        if (existingChat) {
          return res.json({ status: '1', chatId: existingChat._id });
        }
        // Create new chat
        const participants = getSortedParticipants(report.clientId, req.user.id);
        const newChat = { participants, createdAt: Date.now(), updatedAt: Date.now() };
        chatsDB.insert(newChat, (err, chat) => {
          if (err) return res.json({ status: '0', message: err.message });
          res.json({ status: '1', chatId: chat._id });
        });
      });
    });
  });
});

// Admin: refuse report
router.patch('/admin/:reportId/refuse', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ status: '0' });
  getDB(req).reportsDB.update({ _id: req.params.reportId }, { $set: { status: 'refused' } }, {}, (err) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1' });
  });
});

module.exports = router;