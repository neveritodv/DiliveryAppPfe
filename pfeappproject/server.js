const express = require('express');
const cors = require('cors');   // <-- added
const app = express();

app.use(cors());                 // <-- allow all origins for now
app.use(express.json());

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'test@test.com' && password === '123456') {
    res.json({
      status: "1",
      payload: {
        user_id: 1,
        name: "Test User",
        email: email,
        mobile: "1234567890",
        address: "123 Test St",
        auth_token: "fake_token_123"
      },
      message: "Login successful"
    });
  } else {
    res.json({
      status: "0",
      message: "Invalid email or password"
    });
  }
});

app.listen(3001, () => {
  console.log('Mock backend running on http://localhost:3001');
});