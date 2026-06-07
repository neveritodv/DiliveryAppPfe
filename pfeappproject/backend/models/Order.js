const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  deliveryAddress: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked_up', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'mobile_money'] },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);