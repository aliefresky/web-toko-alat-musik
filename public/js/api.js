const BASE_URL = '/api';

const Api = {
  _token() { return localStorage.getItem('token'); },
  _user()  { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } },
  isAdmin() { return this._user()?.role === 'admin'; },

  async _fetch(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this._token()) headers['Authorization'] = `Bearer ${this._token()}`;
    const res = await fetch(BASE_URL + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json().catch(() => ({ success: false, message: 'Server error' }));
    return { ok: res.ok, status: res.status, data: json };
  },

  get(path)         { return this._fetch('GET',    path); },
  post(path, body)  { return this._fetch('POST',   path, body); },
  patch(path, body) { return this._fetch('PATCH',  path, body); },
  delete(path)      { return this._fetch('DELETE', path); },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },
};

function requireAuth() {
  if (!localStorage.getItem('token')) { window.location.href = '/login.html'; return false; }
  return true;
}

function formatRupiah(amount) {
  return 'Rp\u00a0' + Number(amount).toLocaleString('id-ID');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add('hide');
    setTimeout(() => t.remove(), 250);
  }, 3000);
}

async function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge || !localStorage.getItem('token')) return;
  try {
    const { ok, data } = await Api.get('/cart');
    if (ok) badge.textContent = data.data?.items?.length || 0;
  } catch { /* ignore */ }
}

function renderRoleBadge() {
  const el = document.getElementById('roleDisplay');
  if (!el) return;
  const user = Api._user();
  if (!user) return;
  el.innerHTML = `<span class="role-badge ${user.role}">${user.role}</span>`;
}

const CATEGORY_ICONS = {
  'Gitar': '\ud83c\udfb8', 'Bass': '\ud83c\udfb8', 'Drum & Perkusi': '\ud83e\udd41',
  'Keyboard & Piano': '\ud83c\udfb9', 'Ukulele': '\ud83e\ude97', 'Alat Gesek': '\ud83c\udfbb',
  'Alat Tiup': '\ud83c\udfba', 'Aksesori': '\ud83c\udfb5',
};
function getCategoryIcon(cat) { return CATEGORY_ICONS[cat] || '\ud83c\udfb5'; }
