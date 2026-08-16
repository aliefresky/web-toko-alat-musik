/**
 * API Automation Tests — Supertest
 * Minimum 12 test cases (total: 15)
 */
const request = require('supertest');
const app = require('../../src/app');
const { initializeDb, closeDb, seedData, getDb } = require('../../src/database');

let token = '';
let productId = '';

beforeAll(() => {
  initializeDb({ inMemory: true });
  seedData(getDb());
});

afterAll(() => closeDb());

// ───── TC-01: Login sukses ─────────────────────────────────────────────
describe('TC-01 | Auth: Login sukses dengan kredensial valid', () => {
  test('POST /api/auth/login mengembalikan 200 dan token JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@tokomusik.com', password: 'user123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    token = res.body.data.token;
  });
});

// ───── TC-02: Login dengan password salah ─────────────────────────────
describe('TC-02 | Auth: Login gagal dengan password salah', () => {
  test('POST /api/auth/login mengembalikan 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@tokomusik.com', password: 'salah' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ───── TC-03: Login dengan email tidak terdaftar ──────────────────────
describe('TC-03 | Auth: Login dengan email tidak terdaftar', () => {
  test('POST /api/auth/login mengembalikan 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tidakada@test.com', password: 'test' });
    expect(res.status).toBe(401);
  });
});

// ───── TC-04: Login dengan username ───────────────────────────────────
describe('TC-04 | Auth: Login sukses menggunakan username', () => {
  test('POST /api/auth/login dengan username mengembalikan 200', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user', password: 'user123' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
  });
});

// ───── TC-05: Akses endpoint tanpa token ──────────────────────────────
describe('TC-05 | Auth: Akses endpoint terproteksi tanpa token', () => {
  test('GET /api/cart mengembalikan 401', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });
});

// ───── TC-06: Mendapatkan semua produk ────────────────────────────────
describe('TC-06 | Products: GET semua produk', () => {
  test('GET /api/products mengembalikan 200 dan daftar produk', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    productId = res.body.data[0].id;
  });
});

// ───── TC-07: Mendapatkan produk berdasarkan ID ───────────────────────
describe('TC-07 | Products: GET produk berdasarkan ID', () => {
  test('GET /api/products/:id mengembalikan 200 dan data produk', async () => {
    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', productId);
  });
});

// ───── TC-08: GET produk dengan ID tidak valid ────────────────────────
describe('TC-08 | Products: GET produk dengan ID yang tidak ada', () => {
  test('GET /api/products/tidakada mengembalikan 404', async () => {
    const res = await request(app).get('/api/products/id-tidak-ada-123');
    expect(res.status).toBe(404);
  });
});

// ───── TC-09: Tambah item ke keranjang ────────────────────────────────
describe('TC-09 | Cart: Menambahkan produk ke keranjang', () => {
  test('POST /api/cart mengembalikan 201 dan isi keranjang', async () => {
    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, quantity: 1 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });
});

// ───── TC-10: Lihat isi keranjang ─────────────────────────────────────
describe('TC-10 | Cart: Melihat isi keranjang', () => {
  test('GET /api/cart mengembalikan 200 dan items', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('items');
    expect(res.body.data).toHaveProperty('total');
  });
});

// ───── TC-11: Buat pesanan dari keranjang ─────────────────────────────
describe('TC-11 | Orders: Membuat pesanan baru', () => {
  let orderId = '';
  test('POST /api/orders mengembalikan 201 dan pesanan DRAFT', async () => {
    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);
    const items = cartRes.body.data.items.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient_name: 'Andi Budi', shipping_address: 'Jl. Sudirman No.5 Makassar', phone: '081234567890', items });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
    orderId = res.body.data.id;
  });

  test('Verifikasi pesanan tersimpan di GET /api/orders', async () => {
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const found = res.body.data.find(o => o.id === orderId);
    expect(found).toBeDefined();
  });
});

// ───── TC-12: Update status pesanan DRAFT → CONFIRMED ─────────────────
describe('TC-12 | Orders: Update status DRAFT → CONFIRMED', () => {
  test('PATCH /api/orders/:id/status mengembalikan 200 dan status baru', async () => {
    // buat ulang pesanan
    const p = await request(app).get('/api/products').then(r => r.body.data[1]);
    await request(app).post('/api/cart').set('Authorization', `Bearer ${token}`).send({ product_id: p.id, quantity: 1 });
    const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    const items = cart.body.data.items.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
    const orderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`)
      .send({ recipient_name: 'Budi', shipping_address: 'Jl. Merdeka 1', phone: '08111', items });
    const res = await request(app)
      .patch(`/api/orders/${orderRes.body.data.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
  });
});

// ───── TC-13: Transisi status tidak valid ─────────────────────────────
describe('TC-13 | Orders: Transisi status tidak valid', () => {
  test('PATCH status COMPLETED → CANCELLED harus mengembalikan 400', async () => {
    const p = await request(app).get('/api/products').then(r => r.body.data[2]);
    await request(app).post('/api/cart').set('Authorization', `Bearer ${token}`).send({ product_id: p.id, quantity: 1 });
    const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    const items = cart.body.data.items.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
    const orderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`)
      .send({ recipient_name: 'C', shipping_address: 'D', phone: '08222', items });
    const oid = orderRes.body.data.id;
    await request(app).patch(`/api/orders/${oid}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'CONFIRMED' });
    await request(app).patch(`/api/orders/${oid}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'COMPLETED' });
    const res = await request(app).patch(`/api/orders/${oid}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'CANCELLED' });
    expect(res.status).toBe(400);
  });
});

// ───── TC-14: Tambah ke keranjang melebihi stok ───────────────────────
describe('TC-14 | Cart: Jumlah melebihi stok produk', () => {
  test('POST /api/cart dengan quantity > stock mengembalikan 400', async () => {
    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, quantity: 9999 });
    expect(res.status).toBe(400);
  });
});

// ───── TC-15: Checkout dengan keranjang kosong ────────────────────────
describe('TC-15 | Orders: Checkout dengan items kosong', () => {
  test('POST /api/orders tanpa items mengembalikan 400', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient_name: 'X', shipping_address: 'Y', phone: '08333', items: [] });
    expect(res.status).toBe(400);
  });
});
