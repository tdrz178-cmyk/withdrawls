async function send(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  let json = {};
  try { json = await res.json(); } catch {}
  if (!res.ok) {
    throw new Error(json.error || 'Request failed');
  }
  return json;
}

const signupForm = document.getElementById('signupForm');
const signinForm = document.getElementById('signinForm');

signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('signupMsg');
  msg.textContent = '';
  const data = Object.fromEntries(new FormData(signupForm).entries());
  try {
    await send('/signup', data);
    msg.textContent = 'Signed up successfully!';
    signupForm.reset();
  } catch (err) {
    msg.textContent = err.message;
  }
});

signinForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('signinMsg');
  msg.textContent = '';
  const data = Object.fromEntries(new FormData(signinForm).entries());
  try {
    await send('/signin', data);
    msg.textContent = 'Signed in successfully!';
    signinForm.reset();
  } catch (err) {
    msg.textContent = err.message;
  }
});

