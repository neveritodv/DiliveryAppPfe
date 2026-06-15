const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
const restaurantsDB = new Datastore({ filename: path.join(dataDir, 'restaurants.db'), autoload: true });
const productsDB = new Datastore({ filename: path.join(dataDir, 'products.db'), autoload: true });

// Fix restaurants
restaurantsDB.find({}, (err, restos) => {
  restos.forEach(r => {
    let newImage = r.image;
    if (newImage && !newImage.startsWith('/uploads/')) {
      newImage = '/uploads/' + path.basename(newImage);
      restaurantsDB.update({ _id: r._id }, { $set: { image: newImage } });
      console.log(`Fixed restaurant: ${r.name} -> ${newImage}`);
    }
  });
});

// Fix products
productsDB.find({}, (err, prods) => {
  prods.forEach(p => {
    let newImage = p.image;
    if (newImage && !newImage.startsWith('/uploads/')) {
      newImage = '/uploads/' + path.basename(newImage);
      productsDB.update({ _id: p._id }, { $set: { image: newImage } });
      console.log(`Fixed product: ${p.name} -> ${newImage}`);
    }
  });
});