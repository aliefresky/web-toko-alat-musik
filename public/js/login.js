if (localStorage.getItem('token')) window.location.href = '/products.html';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const emailVal = document.getElementById('email').value.trim();
  const passVal = document.getElementById('password').value;
  document.getElementById('emailError').textContent = '';
  document.getElementById('passwordError').textContent = '';
  document.getElementById('loginError').textContent = '';

  let valid = true;
  if (!emailVal) { document.getElementById('emailError').textContent = 'Email atau username wajib diisi'; valid = false; }
  if (!passVal)  { document.getElementById('passwordError').textContent = 'Password wajib diisi'; valid = false; }
  if (!valid) return;

  btn.textContent = 'Memproses...'; btn.disabled = true;
  try {
    const { ok, data } = await Api.post('/auth/login', { email: emailVal, password: passVal });
    if (ok) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      showToast('Login berhasil! Selamat datang.', 'success');
      setTimeout(() => window.location.href = '/products.html', 500);
    } else {
      document.getElementById('loginError').textContent = data.message || 'Login gagal';
    }
  } catch {
    document.getElementById('loginError').textContent = 'Tidak dapat terhubung ke server';
  } finally {
    btn.textContent = 'Masuk'; btn.disabled = false;
  }
});
