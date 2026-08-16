const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const request = require('supertest');
const app = require('../../../src/app');
const { initializeDb, closeDb, seedData, getDb } = require('../../../src/database');
const assert = require('assert');

let response;
let authToken = '';
let currentProductId = '';
let currentOrderId = '';

Before(async () => {
  initializeDb({ inMemory: true });
  seedData(getDb());
});

After(async () => {
  closeDb();
});

// ─── Given ───────────────────────────────────────────────────────────

Given('server is running and database is available', () => {
  // initialized in Before hook
});

Given('I am logged in as {string} with password {string}', async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.strictEqual(res.status, 200);
  authToken = res.body.data.token;
});

Given('I have items in the cart', async () => {
  const products = await request(app).get('/api/products');
  currentProductId = products.body.data[0].id;
  await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ product_id: currentProductId, quantity: 1 });
});

Given('I have an order with status DRAFT', async () => {
  const products = await request(app).get('/api/products');
  currentProductId = products.body.data[0].id;
  await request(app).post('/api/cart').set('Authorization', `Bearer ${authToken}`).send({ product_id: currentProductId, quantity: 1 });
  const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${authToken}`);
  const items = cart.body.data.items.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
  const res = await request(app).post('/api/orders').set('Authorization', `Bearer ${authToken}`)
    .send({ recipient_name: 'Tester', shipping_address: 'Jl. Test 1', phone: '08100', items });
  currentOrderId = res.body.data.id;
});

Given('I have an order with status COMPLETED', async () => {
  const products = await request(app).get('/api/products');
  currentProductId = products.body.data[0].id;
  await request(app).post('/api/cart').set('Authorization', `Bearer ${authToken}`).send({ product_id: currentProductId, quantity: 1 });
  const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${authToken}`);
  const items = cart.body.data.items.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
  const orderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${authToken}`)
    .send({ recipient_name: 'Tester', shipping_address: 'Jl. Test 2', phone: '08200', items });
  currentOrderId = orderRes.body.data.id;
  await request(app).patch(`/api/orders/${currentOrderId}/status`).set('Authorization', `Bearer ${authToken}`).send({ status: 'CONFIRMED' });
  await request(app).patch(`/api/orders/${currentOrderId}/status`).set('Authorization', `Bearer ${authToken}`).send({ status: 'COMPLETED' });
});

// ─── When ────────────────────────────────────────────────────────────

When('I send POST to {string} with body:', async (path, dataTable) => {
  const raw = dataTable.rowsHash();
  response = await request(app).post(path).send(raw);
});

When('I send POST to {string} with email {string} and password {string}', async (path, email, password) => {
  response = await request(app).post(path).send({ email: email || undefined, password: password || undefined });
});

When('I add the first product to cart with quantity {int}', async (qty) => {
  const products = await request(app).get('/api/products');
  currentProductId = products.body.data[0].id;
  response = await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ product_id: currentProductId, quantity: qty });
});

When('I send POST to {string} with empty items', async (path) => {
  response = await request(app)
    .post(path)
    .set('Authorization', `Bearer ${authToken}`)
    .send({ recipient_name: 'X', shipping_address: 'Y', phone: '08000', items: [] });
});

When('I checkout with complete data', async () => {
  const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${authToken}`);
  const items = cart.body.data.items.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
  response = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ recipient_name: 'Budi Santoso', shipping_address: 'Jl. Pemuda No.10 Makassar', phone: '081234567890', items });
  if (response.body.data) currentOrderId = response.body.data.id;
});

When('I checkout with recipient_name {string} address {string} phone {string}', async (name, address, phone) => {
  const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${authToken}`);
  const items = cart.body.data.items.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
  response = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ recipient_name: name, shipping_address: address, phone, items });
});

When('I change the order status to {string}', async (status) => {
  response = await request(app)
    .patch(`/api/orders/${currentOrderId}/status`)
    .set('Authorization', `Bearer ${authToken}`)
    .send({ status });
});

// ─── Then ────────────────────────────────────────────────────────────

Then('response status is {int}', (expectedStatus) => {
  assert.strictEqual(response.status, expectedStatus, `Expected ${expectedStatus} but got ${response.status}. Body: ${JSON.stringify(response.body)}`);
});

Then('response has field {string} with value {string}', (field, value) => {
  const keys = field.split('.');
  let obj = response.body;
  for (const k of keys) obj = obj[k];
  const expected = value === 'true' ? true : value === 'false' ? false : value;
  assert.deepStrictEqual(obj, expected);
});

Then('response has field {string}', (field) => {
  const keys = field.split('.');
  let obj = response.body;
  for (const k of keys) obj = obj?.[k];
  assert.notStrictEqual(obj, undefined, `Field "${field}" not found in response`);
  assert.notStrictEqual(obj, null);
});

Then('cart has {int} item or more', (count) => {
  const items = response.body.data?.items;
  assert.ok(Array.isArray(items), 'items is not an array');
  assert.ok(items.length >= count, `Expected at least ${count} items, got ${items.length}`);
});

Then('order has status {string}', (status) => {
  assert.strictEqual(response.body.data?.status, status);
});

Then('cart is cleared after checkout', async () => {
  const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${authToken}`);
  assert.strictEqual(cart.body.data.items.length, 0);
});
