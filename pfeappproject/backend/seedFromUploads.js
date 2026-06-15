const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');

const restaurantsDB = new Datastore({ filename: path.join(dataDir, 'restaurants.db'), autoload: true });
const productsDB = new Datastore({ filename: path.join(dataDir, 'products.db'), autoload: true });

// Clear old data
restaurantsDB.remove({}, { multi: true });
productsDB.remove({}, { multi: true });

// Get all image files from uploads
const images = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));

// Create restaurant entries from images that look like restaurant names
const restaurantImages = images.filter(f => /resto|bistro|cafe|pizza|sushi|burger/i.test(f));
restaurantImages.forEach((img, idx) => {
  const name = img.replace(/\.[^/.]+$/, '').replace(/[0-9]/g, '').replace(/[_-]/g, ' ');
  restaurantsDB.insert({
    name: name || `Restaurant ${idx+1}`,
    image: `/uploads/${img}`,
    rating: (Math.random() * 2 + 3).toFixed(1),
    foodType: ['Italian', 'French', 'Japanese', 'American', 'Fast Food'][idx % 5],
    address: `${idx+1} Rue de Paris, 7500${idx+1}`,
    createdAt: Date.now()
  });
});

// Create product entries from all other images
const productImages = images.filter(f => !restaurantImages.includes(f));
productImages.forEach((img, idx) => {
  const name = img.replace(/\.[^/.]+$/, '').replace(/[0-9]/g, '').replace(/[_-]/g, ' ');
  productsDB.insert({
    name: name || `Product ${idx+1}`,
    description: 'Delicious item',
    price: (Math.random() * 20 + 5).toFixed(2),
    image: `/uploads/${img}`,
    category: Math.random() > 0.5 ? 'food' : 'can',
    stock: Math.floor(Math.random() * 100),
    createdAt: Date.now()
  });
});

console.log(`✅ Seeded ${restaurantImages.length} restaurants, ${productImages.length} products`);