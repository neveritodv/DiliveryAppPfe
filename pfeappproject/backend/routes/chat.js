const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

const getDB = (req) => req.app.locals.db;

// Helper to create a sorted participants array
function getSortedParticipants(userId1, userId2) {
  return [userId1, userId2].sort();
}

// Get or create a chat between two users
router.post('/get-or-create', auth, async (req, res) => {
  const { otherUserId } = req.body;
  const participants = getSortedParticipants(req.user.id, otherUserId);
  const chatsDB = getDB(req).chatsDB;
  let chat = await new Promise((resolve, reject) => {
    chatsDB.findOne({ participants: participants }, (err, doc) => err ? reject(err) : resolve(doc));
  });
  if (!chat) {
    const newChat = { participants, createdAt: Date.now(), updatedAt: Date.now() };
    chatsDB.insert(newChat, (err, doc) => res.json({ status: '1', payload: doc }));
  } else {
    res.json({ status: '1', payload: chat });
  }
});

// Get all chats for current user
router.get('/my-chats', auth, async (req, res) => {
  const chatsDB = getDB(req).chatsDB;
  // find chats where the user is in the participants array
  chatsDB.find({ participants: req.user.id }, (err, chats) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: chats });
  });
});

// Get messages for a chat
router.get('/messages/:chatId', auth, async (req, res) => {
  const messagesDB = getDB(req).messagesDB;
  messagesDB.find({ chatId: req.params.chatId }).sort({ createdAt: 1 }).exec((err, msgs) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: msgs });
  });
});

// Send a message (HTTP fallback, real-time via WebSocket)
router.post('/message', auth, async (req, res) => {
  const { chatId, text } = req.body;
  const messagesDB = getDB(req).messagesDB;
  const message = { chatId, senderId: req.user.id, text, createdAt: Date.now(), read: false };
  messagesDB.insert(message, (err, newMsg) => {
    if (err) return res.json({ status: '0', message: err.message });
    getDB(req).chatsDB.update({ _id: chatId }, { $set: { updatedAt: Date.now() } }, {}, () => {});
    const io = req.app.get('io');
    io.to(`chat_${chatId}`).emit('new-message', newMsg);
    res.json({ status: '1', payload: newMsg });
  });
});

// Mark messages as read
router.patch('/read/:chatId', auth, async (req, res) => {
  const messagesDB = getDB(req).messagesDB;
  messagesDB.update({ chatId: req.params.chatId, senderId: { $ne: req.user.id }, read: false }, { $set: { read: true } }, { multi: true }, (err) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1' });
  });
});

// Get a single chat by ID
router.get('/:chatId', auth, (req, res) => {
  getDB(req).chatsDB.findOne({ _id: req.params.chatId }, (err, chat) => {
    if (err) return res.json({ status: '0', message: err.message });
    res.json({ status: '1', payload: chat });
  });
});

module.exports = router;