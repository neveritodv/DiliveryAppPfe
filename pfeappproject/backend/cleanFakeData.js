const Datastore = require('@seald-io/nedb');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const restaurantsDB = new Datastore({ filename: path.join(dataDir, 'restaurants.db'), autoload: true });
const productsDB = new Datastore({ filename: path.join(dataDir, 'products.db'), autoload: true });

// Remove all documents
restaurantsDB.remove({}, { multi: true }, (err, num) => {
  if (err) console.error(err);
  else console.log(`🗑️ Deleted ${num} restaurants`);
});
productsDB.remove({}, { multi: true }, (err, num) => {
  if (err) console.error(err);
  else console.log(`🗑️ Deleted ${num} products`);
});