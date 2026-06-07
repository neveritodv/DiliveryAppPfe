const Datastore = require('@seald-io/nedb');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const usersDB = new Datastore({ filename: path.join(dataDir, 'users.db'), autoload: true });
const ordersDB = new Datastore({ filename: path.join(dataDir, 'orders.db'), autoload: true });
const reportsDB = new Datastore({ filename: path.join(dataDir, 'reports.db'), autoload: true });
const chatsDB = new Datastore({ filename: path.join(dataDir, 'chats.db'), autoload: true });
const messagesDB = new Datastore({ filename: path.join(dataDir, 'messages.db'), autoload: true });

const reportReasons = [
  "Late delivery", "Rude behavior", "Wrong order", "Damaged items", "Driver didn't follow instructions"
];
const reportStatuses = ["pending", "accepted", "refused"];

async function seed() {
  // Get all users
  const users = await new Promise((resolve, reject) => {
    usersDB.find({}, (err, docs) => err ? reject(err) : resolve(docs));
  });
  const clients = users.filter(u => u.role === 'client');
  const deliveryPersons = users.filter(u => u.role === 'delivery');
  const admins = users.filter(u => u.role === 'admin');
  const admin = admins[0]; // pick first admin

  if (!admin) {
    console.error('No admin user found. Create one first.');
    return;
  }
  if (clients.length === 0 || deliveryPersons.length === 0) {
    console.error('Need at least one client and one delivery person.');
    return;
  }

  // Get delivered orders (status delivered)
  const deliveredOrders = await new Promise((resolve, reject) => {
    ordersDB.find({ status: 'delivered' }, (err, docs) => err ? reject(err) : resolve(docs));
  });
  if (deliveredOrders.length === 0) {
    console.error('No delivered orders found. Run order seeder first.');
    return;
  }

  // Clear existing reports, chats, messages
  await new Promise((resolve, reject) => {
    reportsDB.remove({}, { multi: true }, (err) => err ? reject(err) : resolve());
  });
  await new Promise((resolve, reject) => {
    chatsDB.remove({}, { multi: true }, (err) => err ? reject(err) : resolve());
  });
  await new Promise((resolve, reject) => {
    messagesDB.remove({}, { multi: true }, (err) => err ? reject(err) : resolve());
  });

  // Create 5 fake reports
  const reports = [];
  for (let i = 0; i < 5; i++) {
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    const randomDelivery = deliveryPersons[Math.floor(Math.random() * deliveryPersons.length)];
    const randomOrder = deliveredOrders[Math.floor(Math.random() * deliveredOrders.length)];
    const reason = reportReasons[Math.floor(Math.random() * reportReasons.length)];
    const status = reportStatuses[Math.floor(Math.random() * reportStatuses.length)];
    const report = {
      clientId: randomClient._id,
      orderId: randomOrder._id,
      deliveryPersonId: randomDelivery._id,
      reason,
      description: `This is a ${reason.toLowerCase()} report. The driver was very unprofessional.`,
      status,
      createdAt: Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000) // random past days
    };
    await new Promise((resolve, reject) => {
      reportsDB.insert(report, (err, doc) => err ? reject(err) : resolve(doc));
      reports.push(report);
    });
  }
  console.log(`✅ Inserted ${reports.length} fake reports.`);

  // Create chats between admin and clients/delivery, and between clients and delivery
  const chatParticipants = [];
  // Admin ↔ clients
  for (let client of clients) {
    chatParticipants.push([admin._id, client._id]);
  }
  // Admin ↔ delivery persons
  for (let delivery of deliveryPersons) {
    chatParticipants.push([admin._id, delivery._id]);
  }
  // Some clients ↔ delivery persons
  for (let i = 0; i < 5; i++) {
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    const randomDelivery = deliveryPersons[Math.floor(Math.random() * deliveryPersons.length)];
    chatParticipants.push([randomClient._id, randomDelivery._id]);
  }

  // Remove duplicates
  const uniqueChats = [];
  for (let participants of chatParticipants) {
    const key = participants.sort().join('|');
    if (!uniqueChats.find(c => c.participants.sort().join('|') === key)) {
      uniqueChats.push({ participants: participants.sort() });
    }
  }

  const insertedChats = [];
  for (let chat of uniqueChats) {
    const newChat = { participants: chat.participants, createdAt: Date.now(), updatedAt: Date.now() };
    await new Promise((resolve, reject) => {
      chatsDB.insert(newChat, (err, doc) => err ? reject(err) : resolve(doc));
      insertedChats.push(doc);
    });
  }
  console.log(`✅ Inserted ${insertedChats.length} fake chats.`);

  // For each chat, insert 3-10 fake messages
  let totalMessages = 0;
  for (let chat of insertedChats) {
    const numMessages = Math.floor(Math.random() * 8) + 3;
    const participants = chat.participants;
    let lastTimestamp = chat.createdAt;
    for (let i = 0; i < numMessages; i++) {
      const sender = participants[Math.floor(Math.random() * participants.length)];
      const messageTexts = [
        "Hello!", "How are you?", "When will my order arrive?", "Thanks for your help!",
        "I have a question.", "Please deliver to the back door.", "I'm waiting outside.",
        "Can you call me?", "Thank you!", "I'm running late.", "On my way!", "Please confirm."
      ];
      const text = messageTexts[Math.floor(Math.random() * messageTexts.length)];
      lastTimestamp += Math.floor(Math.random() * 30 * 60 * 1000); // random minutes apart
      const message = {
        chatId: chat._id,
        senderId: sender,
        text,
        createdAt: lastTimestamp,
        read: Math.random() > 0.5
      };
      await new Promise((resolve, reject) => {
        messagesDB.insert(message, (err) => err ? reject(err) : resolve());
      });
      totalMessages++;
    }
    // Update chat's updatedAt
    await new Promise((resolve, reject) => {
      chatsDB.update({ _id: chat._id }, { $set: { updatedAt: lastTimestamp } }, {}, (err) => err ? reject(err) : resolve());
    });
  }
  console.log(`✅ Inserted ${totalMessages} fake messages.`);
}

seed().catch(console.error);