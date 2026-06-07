const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const productsDB = new Datastore({ filename: path.join(dataDir, 'products.db'), autoload: true });

productsDB.ensureIndex({ fieldName: 'name' }, (err) => {
  if (err) console.log('Index error:', err);
});

const fakeOffers = [
  {
    name: "Margherita Pizza",
    description: "Classic pizza with fresh mozzarella, tomatoes, and basil. 40% OFF!",
    price: 18.00,
    offerPrice: 10.80,
    rate: "4.8",
    rating: "256",
    type: "Italian",
    food_type: "Fast Food",
    image: "assets/img/item_1.png",
    isOffer: true,
    createdAt: Date.now()
  },
  {
    name: "Double Cheeseburger",
    description: "Two juicy beef patties with double cheese. Buy 1 Get 1 Free!",
    price: 15.00,
    offerPrice: 7.50,
    rate: "4.7",
    rating: "189",
    type: "American",
    food_type: "Fast Food",
    image: "assets/img/item_2.png",
    isOffer: true,
    createdAt: Date.now()
  },
  {
    name: "Sushi Platter",
    description: "24 pieces of assorted fresh sushi. 30% OFF!",
    price: 35.00,
    offerPrice: 24.50,
    rate: "4.9",
    rating: "312",
    type: "Japanese",
    food_type: "Seafood",
    image: "assets/img/item_3.png",
    isOffer: true,
    createdAt: Date.now()
  },
  {
    name: "Chicken Shawarma",
    description: "Authentic Middle Eastern shawarma with garlic sauce. 25% OFF!",
    price: 12.00,
    offerPrice: 9.00,
    rate: "4.6",
    rating: "145",
    type: "Lebanese",
    food_type: "Middle Eastern",
    image: "assets/img/offer_1.png",
    isOffer: true,
    createdAt: Date.now()
  },
  {
    name: "Pad Thai",
    description: "Traditional Thai stir-fried noodles with shrimp. 35% OFF!",
    price: 16.00,
    offerPrice: 10.40,
    rate: "4.7",
    rating: "198",
    type: "Thai",
    food_type: "Asian",
    image: "assets/img/offer_2.png",
    isOffer: true,
    createdAt: Date.now()
  },
  {
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with molten center. 50% OFF dessert!",
    price: 10.00,
    offerPrice: 5.00,
    rate: "4.9",
    rating: "420",
    type: "Dessert",
    food_type: "Bakery",
    image: "assets/img/offer_3.png",
    isOffer: true,
    createdAt: Date.now()
  },
  {
    name: "Caesar Salad",
    description: "Fresh romaine lettuce with parmesan and croutons. 20% OFF!",
    price: 8.00,
    offerPrice: 6.40,
    rate: "4.5",
    rating: "167",
    type: "Salad",
    food_type: "Healthy",
    image: "assets/img/offer_1.png",
    isOffer: true,
    createdAt: Date.now()
  },
  {
    name: "Pepperoni Pizza",
    description: "Loaded with pepperoni and extra cheese. 30% OFF large size!",
    price: 20.00,
    offerPrice: 14.00,
    rate: "4.8",
    rating: "275",
    type: "Italian",
    food_type: "Fast Food",
    image: "assets/img/item_1.png",
    isOffer: true,
    createdAt: Date.now()
  },
  {
    name: "Grilled Salmon",
    description: "Fresh Atlantic salmon with lemon butter sauce. 25% OFF!",
    price: 28.00,
    offerPrice: 21.00,
    rate: "4.9",
    rating: "203",
    type: "Seafood",
    food_type: "Healthy",
    image: "assets/img/item_2.png",
    isOffer: true,
    createdAt: Date.now()
  },
  {
    name: "Mango Smoothie Bowl",
    description: "Refreshing smoothie bowl with fresh fruits. 40% OFF!",
    price: 9.00,
    offerPrice: 5.40,
    rate: "4.6",
    rating: "134",
    type: "Drinks",
    food_type: "Healthy",
    image: "assets/img/offer_2.png",
    isOffer: true,
    createdAt: Date.now()
  }
];

// Delete existing offers first
productsDB.remove({ isOffer: true }, { multi: true }, (err, numRemoved) => {
  if (err) console.log('❌ Remove error:', err);
  else console.log(`✅ Removed ${numRemoved} old offers`);

  let count = 0;
  fakeOffers.forEach((offer) => {
    productsDB.insert(offer, (err, doc) => {
      if (err) {
        console.log(`❌ Error inserting ${offer.name}:`, err);
      } else {
        count++;
        console.log(`✅ Inserted: ${doc.name} - \$${doc.offerPrice} (was \$${doc.price}) - Image: ${doc.image}`);
      }
      
      if (count === fakeOffers.length) {
        console.log(`\n🎉 Successfully seeded ${count} offers!`);
        process.exit(0);
      }
    });
  });
});