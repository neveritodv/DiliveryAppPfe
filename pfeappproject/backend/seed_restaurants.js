const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const restaurantsDB = new Datastore({ filename: path.join(dataDir, 'restaurants.db'), autoload: true });

const restaurants = [
  {
    name: "Minute by tuk tuk",
    description: "Authentic Sri Lankan cuisine",
    rate: "4.9",
    rating: "124",
    type: "Café",
    food_type: "Sri Lankan",
    image: "assets/img/res_1.png",
    isPopular: true,
    createdAt: Date.now()
  },
  {
    name: "Café de Noir",
    description: "French café with amazing pastries",
    rate: "4.8",
    rating: "98",
    type: "Café",
    food_type: "French",
    image: "assets/img/res_2.png",
    isPopular: true,
    createdAt: Date.now()
  },
  {
    name: "Bakes by Tella",
    description: "Homemade baked goods",
    rate: "4.7",
    rating: "87",
    type: "Bakery",
    food_type: "Desserts",
    image: "assets/img/res_3.png",
    isPopular: false,
    createdAt: Date.now()
  },
  {
    name: "Pizza Roma",
    description: "Authentic Italian pizza",
    rate: "4.9",
    rating: "156",
    type: "Italian",
    food_type: "Fast Food",
    image: "assets/img/m_res_1.png",
    isPopular: true,
    createdAt: Date.now()
  },
  {
    name: "Sushi Master",
    description: "Fresh Japanese sushi",
    rate: "4.9",
    rating: "203",
    type: "Japanese",
    food_type: "Seafood",
    image: "assets/img/m_res_2.png",
    isPopular: true,
    createdAt: Date.now()
  },
  {
    name: "Burger House",
    description: "Best burgers in town",
    rate: "4.6",
    rating: "178",
    type: "American",
    food_type: "Fast Food",
    image: "assets/img/item_1.png",
    isPopular: false,
    createdAt: Date.now()
  },
  {
    name: "Curry Palace",
    description: "Authentic Indian curries",
    rate: "4.8",
    rating: "145",
    type: "Indian",
    food_type: "Spicy",
    image: "assets/img/item_2.png",
    isPopular: true,
    createdAt: Date.now()
  },
  {
    name: "Noodle Bar",
    description: "Asian noodle specialties",
    rate: "4.5",
    rating: "112",
    type: "Asian",
    food_type: "Noodles",
    image: "assets/img/item_3.png",
    isPopular: false,
    createdAt: Date.now()
  }
];

restaurantsDB.remove({}, { multi: true }, (err, numRemoved) => {
  console.log(`Removed ${numRemoved} old restaurants`);
  
  let count = 0;
  restaurants.forEach((r) => {
    restaurantsDB.insert(r, (err, doc) => {
      if (err) console.log('Error:', err);
      else {
        count++;
        console.log(`✅ ${doc.name}`);
      }
      if (count === restaurants.length) {
        console.log(`\n🎉 Seeded ${count} restaurants!`);
        process.exit(0);
      }
    });
  });
});