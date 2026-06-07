const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const ordersDB = new Datastore({ filename: path.join(dataDir, 'orders.db'), autoload: true });

const fakeOrders = [
  {
    clientId: "FAKE_CLIENT_1",
    items: [{ name: "Pizza", price: 12.99, quantity: 2 }],
    total: 25.98,
    deliveryAddress: "10 Rue de la Paix, 75002 Paris",
    location: { lat: 48.8698, lng: 2.3316 },
    status: "pending",
    paymentMethod: "card",
    createdAt: Date.now()
  },
  {
    clientId: "FAKE_CLIENT_2",
    items: [{ name: "Burger", price: 8.99, quantity: 1 }],
    total: 8.99,
    deliveryAddress: "15 Avenue des Champs-Élysées, 75008 Paris",
    location: { lat: 48.8699, lng: 2.3074 },
    status: "pending",
    paymentMethod: "cash",
    createdAt: Date.now() - 30 * 60000
  }
];

ordersDB.insert(fakeOrders, (err, docs) => {
  if (err) console.error("Seed error:", err);
  else console.log(`Inserted ${docs.length} fake orders.`);
});