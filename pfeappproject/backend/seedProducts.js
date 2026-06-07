const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const productsDB = new Datastore({ filename: path.join(dataDir, 'products.db'), autoload: true });

const products = [
  { name: "Margherita Pizza", price: 12.99, description: "Classic cheese and tomato pizza", image: "assets/img/item_1.png", type: "Italian", food_type: "Pizza", rate: "4.8", rating: "245", isOffer: false, createdAt: Date.now() },
  { name: "Cheeseburger", price: 9.99, description: "Beef patty with cheddar", image: "assets/img/item_2.png", type: "American", food_type: "Burger", rate: "4.5", rating: "189", isOffer: false, createdAt: Date.now() },
  { name: "Sushi Set", price: 18.50, description: "Fresh salmon and tuna", image: "assets/img/item_3.png", type: "Japanese", food_type: "Sushi", rate: "4.9", rating: "312", isOffer: false, createdAt: Date.now() },
  { name: "Pad Thai", price: 11.99, description: "Thai noodles with shrimp", image: "assets/img/offer_1.png", type: "Thai", food_type: "Noodles", rate: "4.6", rating: "167", isOffer: false, createdAt: Date.now() },
  { name: "Caesar Salad", price: 8.99, description: "Fresh romaine with parmesan", image: "assets/img/offer_2.png", type: "Salad", food_type: "Healthy", rate: "4.4", rating: "98", isOffer: false, createdAt: Date.now() },
  { name: "Chocolate Cake", price: 6.99, description: "Rich chocolate cake", image: "assets/img/offer_3.png", type: "Dessert", food_type: "Bakery", rate: "4.8", rating: "267", isOffer: false, createdAt: Date.now() },
  { name: "Pepperoni Pizza", price: 13.99, description: "Loaded with pepperoni", image: "assets/img/item_1.png", type: "Italian", food_type: "Pizza", rate: "4.7", rating: "223", isOffer: false, createdAt: Date.now() },
  { name: "Grilled Salmon", price: 18.99, description: "Atlantic salmon", image: "assets/img/item_2.png", type: "Seafood", food_type: "Healthy", rate: "4.9", rating: "198", isOffer: false, createdAt: Date.now() },
  { name: "Mango Smoothie", price: 4.99, description: "Fresh mango smoothie", image: "assets/img/offer_1.png", type: "Drinks", food_type: "Beverages", rate: "4.5", rating: "178", isOffer: false, createdAt: Date.now() },
  { name: "French Fries", price: 3.99, description: "Crispy golden fries", image: "assets/img/offer_2.png", type: "Sides", food_type: "Fast Food", rate: "4.3", rating: "89", isOffer: false, createdAt: Date.now() },
  { name: "Chicken Wings", price: 10.99, description: "Spicy buffalo wings", image: "assets/img/item_3.png", type: "American", food_type: "Spicy", rate: "4.6", rating: "156", isOffer: false, createdAt: Date.now() },
  { name: "Ice Cream Sundae", price: 5.99, description: "Vanilla with chocolate sauce", image: "assets/img/offer_3.png", type: "Dessert", food_type: "Ice Cream", rate: "4.7", rating: "134", isOffer: false, createdAt: Date.now() },
];

productsDB.remove({}, { multi: true }, (err, numRemoved) => {
  console.log(`Removed ${numRemoved} old products`);
  
  let count = 0;
  products.forEach((p) => {
    productsDB.insert(p, (err, doc) => {
      if (err) console.log('Error:', err);
      else { count++; console.log(`✅ ${doc.name} - ${doc.image}`); }
      if (count === products.length) {
        console.log(`\n🎉 Seeded ${count} products!`);
        process.exit(0);
      }
    });
  });
});