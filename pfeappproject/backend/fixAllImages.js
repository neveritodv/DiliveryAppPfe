const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');

const restaurantsDB = new Datastore({ filename: path.join(dataDir, 'restaurants.db'), autoload: true });
const productsDB = new Datastore({ filename: path.join(dataDir, 'products.db'), autoload: true });

// Get list of actual image filenames in uploads folder
const imageFiles = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));

// Helper: find best matching image for a given name
function findMatchingImage(name, category) {
  const lowerName = name.toLowerCase();
  // first try exact match
  let match = imageFiles.find(f => f.toLowerCase() === lowerName + '.jpg') ||
              imageFiles.find(f => f.toLowerCase() === lowerName + '.jpeg') ||
              imageFiles.find(f => f.toLowerCase() === lowerName + '.png');
  if (match) return `/uploads/${match}`;
  // then try partial match
  match = imageFiles.find(f => f.toLowerCase().includes(lowerName));
  if (match) return `/uploads/${match}`;
  // fallback: first image or null
  return imageFiles.length ? `/uploads/${imageFiles[0]}` : null;
}

// Fix restaurants
restaurantsDB.find({}, (err, restos) => {
  if (err) console.error(err);
  restos.forEach(resto => {
    let correctPath = resto.image;
    // if path is missing or does not start with /uploads/, try to derive from name
    if (!correctPath || !correctPath.startsWith('/uploads/')) {
      const matched = findMatchingImage(resto.name, 'restaurant');
      if (matched) correctPath = matched;
      else correctPath = '/fallback.png'; // will be served from admin public
    }
    if (correctPath !== resto.image) {
      restaurantsDB.update({ _id: resto._id }, { $set: { image: correctPath } }, {}, err => {
        if (!err) console.log(`✅ Restaurant "${resto.name}" image set to ${correctPath}`);
      });
    }
  });
});

// Fix products
productsDB.find({}, (err, prods) => {
  if (err) console.error(err);
  prods.forEach(prod => {
    let correctPath = prod.image;
    if (!correctPath || !correctPath.startsWith('/uploads/')) {
      const matched = findMatchingImage(prod.name, 'product');
      if (matched) correctPath = matched;
      else correctPath = '/fallback.png';
    }
    if (correctPath !== prod.image) {
      productsDB.update({ _id: prod._id }, { $set: { image: correctPath } }, {}, err => {
        if (!err) console.log(`✅ Product "${prod.name}" image set to ${correctPath}`);
      });
    }
  });
});

console.log('Image path correction started. Check the console for updates.');