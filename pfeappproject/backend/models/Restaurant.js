const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: String,
  image: String,
  rating: Number,
  foodType: String, // e.g. "Western Food"
  address: String,
  location: { lat: Number, lng: Number }
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);