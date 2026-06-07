const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: String,
  address: String,
  role: { type: String, enum: ['client', 'delivery', 'admin'], default: 'client' },
  isAvailable: { type: Boolean, default: true }, // for delivery
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);