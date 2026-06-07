const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  category: { type: String, enum: ['food', 'can'], required: true }, // CAN products
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }, // only for food
  stock: Number
});

module.exports = mongoose.model('Product', ProductSchema);