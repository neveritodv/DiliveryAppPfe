const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const usersDB = new Datastore({ filename: path.join(dataDir, 'users.db'), autoload: true });
const restaurantsDB = new Datastore({ filename: path.join(dataDir, 'restaurants.db'), autoload: true });
const productsDB = new Datastore({ filename: path.join(dataDir, 'products.db'), autoload: true });
const ordersDB = new Datastore({ filename: path.join(dataDir, 'orders.db'), autoload: true });

const hashPass = async (pass) => await bcrypt.hash(pass, 10);

// ------------------------- USERS -------------------------
const users = [
  { name: "Alice Client", email: "alice@example.com", password: "123456", mobile: "0612345678", address: "12 Rue de Rivoli, 75001 Paris", role: "client" },
  { name: "Bob Client", email: "bob@example.com", password: "123456", mobile: "0623456789", address: "45 Bd Saint-Germain, 75005 Paris", role: "client" },
  { name: "Charlie Client", email: "charlie@example.com", password: "123456", mobile: "0634567890", address: "78 Av Champs-Élysées, 75008 Paris", role: "client" },
  { name: "Diana Client", email: "diana@example.com", password: "123456", mobile: "0645678901", address: "23 Rue Mouffetard, 75005 Paris", role: "client" },
  { name: "Mike Delivery", email: "delivery@example.com", password: "123456", mobile: "0667890123", address: "10 Rue des Livreurs, 75011 Paris", role: "delivery", isAvailable: true },
  { name: "John Delivery", email: "john.delivery@example.com", password: "123456", mobile: "0678901234", address: "20 Rue des Transporteurs, 75012 Paris", role: "delivery", isAvailable: true },
  { name: "Admin", email: "admin@example.com", password: "admin123", mobile: "0600000000", address: "1 Admin Street, Paris", role: "admin" }
];

// ------------------------- RESTAURANTS -------------------------
const restaurants = [
  { name: "Le Petit Bistro", image: "/uploads/resto1.jpg", rating: 4.8, foodType: "French", address: "15 Rue de la Sorbonne, 75005 Paris", location: { lat: 48.8469, lng: 2.3436 } },
  { name: "Pizza Vesuvio", image: "/uploads/resto2.jpg", rating: 4.5, foodType: "Italian", address: "22 Bd de Clichy, 75018 Paris", location: { lat: 48.8838, lng: 2.3339 } },
  { name: "Sushi Palace", image: "/uploads/resto3.jpg", rating: 4.9, foodType: "Japanese", address: "8 Rue Sainte-Anne, 75001 Paris", location: { lat: 48.8685, lng: 2.3367 } },
  { name: "Burger House", image: "/uploads/resto4.jpg", rating: 4.3, foodType: "American", address: "55 Rue Montorgueil, 75002 Paris", location: { lat: 48.8637, lng: 2.3456 } }
];

// ------------------------- PRODUCTS (food & CAN) -------------------------
const products = [
  { name: "Croissant", description: "Fresh butter croissant", price: 2.50, image: "/uploads/croissant.jpg", category: "food", stock: 100 },
  { name: "Margherita Pizza", description: "Tomato, mozzarella, basil", price: 12.90, image: "/uploads/pizza.jpg", category: "food", stock: 50 },
  { name: "Sushi Set", description: "8 pieces + maki", price: 18.90, image: "/uploads/sushi.jpg", category: "food", stock: 30 },
  { name: "Cheeseburger", description: "Beef, cheese, lettuce", price: 9.90, image: "/uploads/burger.jpg", category: "food", stock: 80 },
  { name: "Ratatouille", description: "Provencal vegetable stew", price: 14.50, image: "/uploads/ratatouille.jpg", category: "food", stock: 40 },
  { name: "Crème Brûlée", description: "Vanilla custard", price: 6.50, image: "/uploads/creme.jpg", category: "food", stock: 60 },
  { name: "Ramen Bowl", description: "Tonkotsu broth", price: 15.90, image: "/uploads/ramen.jpg", category: "food", stock: 25 },
  { name: "Falafel Wrap", description: "Falafel, hummus", price: 8.90, image: "/uploads/falafel.jpg", category: "food", stock: 70 },
  { name: "Event T‑Shirt", description: "Limited edition", price: 25.00, image: "/uploads/tshirt.jpg", category: "can", stock: 200 },
  { name: "Cap", description: "Cotton cap", price: 15.00, image: "/uploads/cap.jpg", category: "can", stock: 150 },
  { name: "Poster", description: "A3 poster", price: 10.00, image: "/uploads/poster.jpg", category: "can", stock: 300 },
  { name: "Mug", description: "Ceramic mug", price: 12.00, image: "/uploads/mug.jpg", category: "can", stock: 100 }
];

// ------------------------- ORDERS (with real addresses & geo) -------------------------
const addresses = [
  { address: "10 Rue de la Paix, 75002 Paris", lat: 48.8698, lng: 2.3316 },
  { address: "15 Av des Champs-Élysées, 75008 Paris", lat: 48.8699, lng: 2.3074 },
  { address: "33 Rue du Faubourg Saint-Antoine, 75011 Paris", lat: 48.8524, lng: 2.3784 },
  { address: "22 Bd Saint-Michel, 75006 Paris", lat: 48.8504, lng: 2.3431 }
];
const statuses = ['pending', 'accepted', 'picked_up', 'delivered'];
const methods = ['card', 'cash', 'mobile_money'];

const generateOrders = (clientIds, productIds) => {
  const orders = [];
  for (let i = 0; i < 10; i++) {
    const client = clientIds[Math.floor(Math.random() * clientIds.length)];
    const addr = addresses[Math.floor(Math.random() * addresses.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const payment = methods[Math.floor(Math.random() * methods.length)];
    const items = [];
    let total = 0;
    const numItems = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numItems; j++) {
      const prod = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      items.push({ productId: prod._id, name: prod.name, price: prod.price, quantity: qty });
      total += prod.price * qty;
    }
    orders.push({
      clientId: client,
      items,
      total: parseFloat(total.toFixed(2)),
      deliveryAddress: addr.address,
      location: addr,
      status,
      paymentMethod: payment,
      paymentStatus: payment === 'cash' ? 'pending' : 'paid',
      createdAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
    });
  }
  return orders;
};

async function seed() {
  try {
    // Clear
    await new Promise((res,rej) => usersDB.remove({}, { multi: true }, err => err ? rej(err) : res()));
    await new Promise((res,rej) => restaurantsDB.remove({}, { multi: true }, err => err ? rej(err) : res()));
    await new Promise((res,rej) => productsDB.remove({}, { multi: true }, err => err ? rej(err) : res()));
    await new Promise((res,rej) => ordersDB.remove({}, { multi: true }, err => err ? rej(err) : res()));

    // Insert users
    const insertedUsers = [];
    for (let u of users) {
      const hash = await hashPass(u.password);
      const doc = { ...u, password: hash, createdAt: Date.now() };
      const inserted = await new Promise((resolve,reject) => usersDB.insert(doc, (err,newDoc) => err ? reject(err) : resolve(newDoc)));
      insertedUsers.push(inserted._id);
    }
    console.log(`✅ ${insertedUsers.length} users`);

    // Insert restaurants
    const insertedRestos = [];
    for (let r of restaurants) {
      const inserted = await new Promise((resolve,reject) => restaurantsDB.insert(r, (err,newDoc) => err ? reject(err) : resolve(newDoc)));
      insertedRestos.push(inserted);
    }
    console.log(`✅ ${insertedRestos.length} restaurants`);

    // Insert products (assign restaurantId to food)
    const insertedProducts = [];
    for (let p of products) {
      if (p.category === 'food') {
        const randomResto = insertedRestos[Math.floor(Math.random() * insertedRestos.length)];
        p.restaurantId = randomResto._id;
      }
      const inserted = await new Promise((resolve,reject) => productsDB.insert(p, (err,newDoc) => err ? reject(err) : resolve(newDoc)));
      insertedProducts.push(inserted._id);
    }
    console.log(`✅ ${insertedProducts.length} products`);

    // Insert orders
    const clientIds = insertedUsers.filter((_,i) => i < 4); // first 4 are clients
    const orders = generateOrders(clientIds, insertedProducts);
    for (let o of orders) {
      await new Promise((resolve,reject) => ordersDB.insert(o, (err) => err ? reject(err) : resolve()));
    }
    console.log(`✅ ${orders.length} orders`);

    console.log('\n🌱 Seeding complete!');
    console.log('\n📋 Test credentials:');
    console.log('Client: alice@example.com / 123456');
    console.log('Delivery: delivery@example.com / 123456');
    console.log('Admin: admin@example.com / admin123');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
}

seed();