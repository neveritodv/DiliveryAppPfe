const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const router = express.Router();

const getDB = (req) => req.app.locals.db;

// Use the same uploads directory as server.js
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for avatar upload (mobile)
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, 'avatar_' + Date.now() + '_' + req.user.id + path.extname(file.originalname))
});
const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ---------- Auth Routes ----------

// Sign up
router.post('/sign_up', async (req, res) => {
  try {
    const { name, email, password, mobile, address, role } = req.body;
    const usersDB = getDB(req).usersDB;
    const existing = await new Promise((resolve, reject) => {
      usersDB.findOne({ email }, (err, doc) => err ? reject(err) : resolve(doc));
    });
    if (existing) return res.json({ status: '0', message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { name, email, password: hashed, mobile, address, role: role || 'client', createdAt: Date.now() };
    usersDB.insert(user, (err, newDoc) => {
      if (err) return res.json({ status: '0', message: err.message });
      const token = jwt.sign({ id: newDoc._id, role: newDoc.role }, process.env.JWT_SECRET);
      res.json({ status: '1', payload: { auth_token: token, name, email, role: newDoc.role, userId: newDoc._id, avatar: '', mobile: mobile || '', address: address || '' } });
    });
  } catch (err) {
    res.json({ status: '0', message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usersDB = getDB(req).usersDB;
    const user = await new Promise((resolve, reject) => {
      usersDB.findOne({ email }, (err, doc) => err ? reject(err) : resolve(doc));
    });
    if (!user) return res.json({ status: '0', message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ status: '0', message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ status: '1', payload: { 
      auth_token: token, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      userId: user._id,
      avatar: user.avatar || '',
      mobile: user.mobile || '',
      address: user.address || '',
      isAvailable: user.isAvailable !== false
    }});
  } catch (err) {
    res.json({ status: '0', message: err.message });
  }
});

// Update profile
router.patch('/update-profile', auth, async (req, res) => {
  try {
    const { name, mobile, address, password, isAvailable } = req.body;
    const usersDB = getDB(req).usersDB;
    const update = { name, mobile, address, isAvailable };
    if (password && password.trim() !== '') {
      update.password = await bcrypt.hash(password, 10);
    }
    usersDB.update({ _id: req.user.id }, { $set: update }, {}, (err) => {
      if (err) return res.json({ status: '0', message: err.message });
      res.json({ status: '1', message: 'Profile updated' });
    });
  } catch (err) {
    res.json({ status: '0', message: err.message });
  }
});

// Upload avatar - Supports both multipart (mobile) and base64 (web)
router.post('/upload-avatar', auth, (req, res) => {
  // Check if it's a multipart request (mobile)
  if (req.is('multipart/form-data')) {
    uploadAvatar.single('avatar')(req, res, (err) => {
      if (err) return res.status(400).json({ status: '0', message: err.message });
      if (!req.file) return res.status(400).json({ status: '0', message: 'No file uploaded' });
      
      const avatarUrl = '/uploads/' + req.file.filename;
      getDB(req).usersDB.update(
        { _id: req.user.id }, 
        { $set: { avatar: avatarUrl } }, 
        {}, 
        (err) => {
          if (err) return res.json({ status: '0', message: err.message });
          res.json({ status: '1', avatarUrl });
        }
      );
    });
  } 
  // Check if it's a JSON request with base64 (web)
  else {
    const { avatar, fileName } = req.body;
    
    if (!avatar) {
      return res.status(400).json({ status: '0', message: 'No image data' });
    }

    try {
      // Decode base64
      const buffer = Buffer.from(avatar, 'base64');
      
      // Generate filename
      const ext = path.extname(fileName || 'avatar.jpg') || '.jpg';
      const avatarFileName = 'avatar_' + Date.now() + '_' + req.user.id + ext;
      const avatarPath = path.join(uploadsDir, avatarFileName);
      
      // Save file
      fs.writeFileSync(avatarPath, buffer);
      
      const avatarUrl = '/uploads/' + avatarFileName;
      
      getDB(req).usersDB.update(
        { _id: req.user.id }, 
        { $set: { avatar: avatarUrl } }, 
        {}, 
        (err) => {
          if (err) return res.json({ status: '0', message: err.message });
          res.json({ status: '1', avatarUrl });
        }
      );
    } catch (err) {
      res.json({ status: '0', message: err.message });
    }
  }
});

module.exports = router;