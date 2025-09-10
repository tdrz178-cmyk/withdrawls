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
const googleBtn = document.getElementById('googleSignin');
const appleBtn = document.getElementById('appleSignin');

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

googleBtn?.addEventListener('click', async () => {
  const msg = document.getElementById('signinMsg');
  msg.textContent = '';
  try {
    await send('/auth/google', {});
    msg.textContent = 'Signed in with Google!';
  } catch (err) {
    msg.textContent = err.message;
  }
});

appleBtn?.addEventListener('click', async () => {
  const msg = document.getElementById('signinMsg');
  msg.textContent = '';
  try {
    await send('/auth/apple', {});
    msg.textContent = 'Signed in with Apple!';
  } catch (err) {
    msg.textContent = err.message;
  }
});

