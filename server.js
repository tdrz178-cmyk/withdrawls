const express = require('express');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const app = express();

const feedbackPath = path.join(__dirname, 'feedback.json');

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

app.post('/feedback', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    let feedback = [];
    if (fs.existsSync(feedbackPath)) {
      feedback = JSON.parse(fs.readFileSync(feedbackPath));
    }
    feedback.push({ name, email, message, date: new Date().toISOString() });
    fs.writeFileSync(feedbackPath, JSON.stringify(feedback, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save feedback.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
