const express = require('express');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
