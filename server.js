const express = require('express');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.use(express.static('.'));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
}));

const userFile = path.join(__dirname, 'users.json');

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(userFile));
  } catch {
    return {};
  }
}

function saveUsers(users) {
  fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
}

const products = [
  { id: 1, name: 'Widget', price: 1999 },
  { id: 2, name: 'Gadget', price: 2999 },
  { id: 3, name: 'Doohickey', price: 999 }
];

app.post('/create-checkout-session', async (req, res) => {
  try {
    const lineItems = req.body.items.map((item) => {
      const product = products.find((p) => p.id === item.id);
      return {
        price_data: {
          currency: 'usd',
          product_data: { name: product.name },
          unit_amount: product.price,
        },
        quantity: item.qty,
      };
    });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cart.html`,
    });
    res.json({ id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/enquiries', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@withdrawls',
      to: 'tdrz178@gmail.com',
      subject: `New enquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      replyTo: email,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send enquiry.' });
  }
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  const users = loadUsers();
  if (users[username]) {
    return res.status(400).json({ error: 'User already exists.' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    users[username] = { password: hash };
    saveUsers(users);
    req.session.user = username;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

app.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  const users = loadUsers();
  const user = users[username];
  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials.' });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).json({ error: 'Invalid credentials.' });
  }
  req.session.user = username;
  res.json({ success: true });
});

app.post('/auth/google', (req, res) => {
  req.session.user = 'google_user';
  res.json({ success: true });
});

app.post('/auth/apple', (req, res) => {
  req.session.user = 'apple_user';
  res.json({ success: true });
});

app.post('/signout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user });
  } else {
    res.status(401).json({ error: 'Not signed in.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
