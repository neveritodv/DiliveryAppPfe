require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });

app.set('io', io);
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use('/uploads', express.static('uploads'));

// Uploads folder for images
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// ✅ Serve Flutter assets so the web admin panel can display images
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Data folder for NeDB
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const usersDB = new Datastore({ filename: path.join(dataDir, 'users.db'), autoload: true });
const ordersDB = new Datastore({ filename: path.join(dataDir, 'orders.db'), autoload: true });
const restaurantsDB = new Datastore({ filename: path.join(dataDir, 'restaurants.db'), autoload: true });
const productsDB = new Datastore({ filename: path.join(dataDir, 'products.db'), autoload: true });
const chatsDB = new Datastore({ filename: path.join(dataDir, 'chats.db'), autoload: true });
const messagesDB = new Datastore({ filename: path.join(dataDir, 'messages.db'), autoload: true });
const reportsDB = new Datastore({ filename: path.join(dataDir, 'reports.db'), autoload: true });

app.locals.db = { usersDB, ordersDB, restaurantsDB, productsDB, chatsDB, messagesDB, reportsDB };

// Image upload endpoint
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ status: '0', message: 'No file' });
  res.json({ status: '1', imageUrl: `/uploads/${req.file.filename}` });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/products', require('./routes/products'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/payment', require('./routes/payment'));

// Socket
require('./socket')(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📁 Data stored in: ${dataDir}`);
});