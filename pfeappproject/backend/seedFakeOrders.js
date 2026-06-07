const Datastore = require('@seald-io/nedb');
const path = require('path');

const ordersDB = new Datastore({ filename: path.join(__dirname, 'data', 'orders.db'), autoload: true });
const productsDB = new Datastore({ filename: path.join(__dirname, 'data', 'products.db'), autoload: true });
const usersDB = new Datastore({ filename: path.join(__dirname, 'data', 'users.db'), autoload: true });

const addresses = [
  { address: "10 Rue de la Paix, 75002 Paris", lat: 48.8698, lng: 2.3316 },
  { address: "15 Avenue des Champs-Élysées, 75008 Paris", lat: 48.8699, lng: 2.3074 },
  { address: "33 Rue du Faubourg Saint-Antoine, 75011 Paris", lat: 48.8524, lng: 2.3784 },
  { address: "22 Boulevard Saint-Michel, 75006 Paris", lat: 48.8504, lng: 2.3431 },
  { address: "55 Rue de Rivoli, 75001 Paris", lat: 48.8584, lng: 2.3497 }
];

async function seed() {
  const clients = await new Promise((resolve, reject) => {
    usersDB.find({ role: 'client' }, (err, docs) => err ? reject(err) : resolve(docs));
  });
  if (clients.length === 0) {
    console.error('❌ No client users. Create one via signup first.');
    return;
  }

  const products = await new Promise((resolve, reject) => {
    productsDB.find({}, (err, docs) => err ? reject(err) : resolve(docs));
  });
  if (products.length === 0) {
    console.error('❌ No products. Add some via admin dashboard first.');
    return;
  }

  // Clear existing pending orders
  await new Promise((resolve, reject) => {
    ordersDB.remove({ status: 'pending' }, { multi: true }, err => err ? reject(err) : resolve());
  });

  for (let i = 0; i < 10; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const addr = addresses[Math.floor(Math.random() * addresses.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let total = 0;
    for (let j = 0; j < numItems; j++) {
      const prod = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      items.push({ productId: prod._id, name: prod.name, price: prod.price, quantity: qty });
      total += prod.price * qty;
    }
    const order = {
      clientId: client._id,
      items,
      total: parseFloat(total.toFixed(2)),
      deliveryAddress: addr.address,
      location: addr,
      status: 'pending',
      paymentMethod: Math.random() > 0.5 ? 'card' : 'cash',
      paymentStatus: 'pending',
      createdAt: Date.now() - Math.floor(Math.random() * 60 * 60 * 1000)
    };
    await new Promise((resolve, reject) => {
      ordersDB.insert(order, err => err ? reject(err) : resolve());
    });
  }
  console.log('✅ Inserted 10 fake pending orders.');
}

seed().catch(console.error);