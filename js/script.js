// Mobile menu toggle
const menuBtn = document.getElementById('menuBtn');
const menu = document.getElementById('menu');
menuBtn?.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

// Contact form (demo only)
const form = document.getElementById('contactForm');
const msg = document.getElementById('msg');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  console.log('Form submitted:', data);
  msg.textContent = "Thanks! (This form doesn't send yet—connect a backend like Netlify Forms or Formspree)";
  form.reset();
});

// Dynamic footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Simple product data
const products = [
  { id: 1, name: 'Widget', price: 19.99 },
  { id: 2, name: 'Gadget', price: 29.99 },
  { id: 3, name: 'Doohickey', price: 9.99 }
];

const cartKey = 'cart';

function getCart() {
  return JSON.parse(localStorage.getItem(cartKey) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const countEl = document.getElementById('cartCount');
  if (!countEl) return;
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  countEl.textContent = count;
}

function addToCart(id) {
  const cart = getCart();
  const found = cart.find((i) => i.id === id);
  if (found) found.qty += 1;
  else cart.push({ id, qty: 1 });
  saveCart(cart);
}

// Render products on index page
const productList = document.getElementById('productList');
if (productList) {
  products.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'product';
    card.innerHTML = `
      <h3>${p.name}</h3>
      <p>$${p.price.toFixed(2)}</p>
      <button data-id="${p.id}" class="btn add-to-cart">Add to Cart</button>
    `;
    productList.appendChild(card);
  });

  productList.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    addToCart(Number(btn.dataset.id));
  });
}

// Render cart page
const cartItems = document.getElementById('cartItems');
if (cartItems) {
  const cart = getCart();
  if (cart.length === 0) {
    cartItems.textContent = 'Your cart is empty.';
  } else {
    cart.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <span>${product.name} x ${item.qty}</span>
        <span>$${(product.price * item.qty).toFixed(2)}</span>
        <button data-id="${item.id}" class="btn remove">Remove</button>
      `;
      cartItems.appendChild(row);
    });
  }

  const total = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.id);
    return sum + product.price * item.qty;
  }, 0);
  document.getElementById('cartTotal').textContent = `Total: $${total.toFixed(2)}`;

  cartItems.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    let cart = getCart().filter((i) => i.id !== id);
    saveCart(cart);
    location.reload();
  });

  document.getElementById('clearCart')?.addEventListener('click', () => {
    saveCart([]);
    location.reload();
  });

  document.getElementById('checkout')?.addEventListener('click', async () => {
    const cart = getCart();
    if (cart.length === 0) return;
    const res = await fetch('/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart })
    });
    const data = await res.json();
    const pk = document.querySelector('meta[name="stripe-pk"]')?.content || 'pk_test_placeholder';
    const stripe = Stripe(pk);
    await stripe.redirectToCheckout({ sessionId: data.id });
  });
}

updateCartCount();
