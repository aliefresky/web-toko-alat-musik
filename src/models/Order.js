const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

const VALID_STATUSES = ['DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const STATUS_TRANSITIONS = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

class Order {
  static validateStatusTransition(currentStatus, newStatus) {
    if (!VALID_STATUSES.includes(newStatus)) throw new Error(`Status tidak valid: ${newStatus}`);
    if (!(STATUS_TRANSITIONS[currentStatus] || []).includes(newStatus))
      throw new Error(`Perubahan status dari ${currentStatus} ke ${newStatus} tidak diizinkan`);
    return true;
  }

  static findById(id) {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return null;
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    return order;
  }

  static findByUser(userId) {
    return getDb().prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  }

  static create({ userId, recipientName, shippingAddress, phone, items }) {
    const errors = [];
    if (!recipientName || String(recipientName).trim() === '') errors.push('Nama penerima wajib diisi');
    if (!shippingAddress || String(shippingAddress).trim() === '') errors.push('Alamat pengiriman wajib diisi');
    if (!phone || String(phone).trim() === '') errors.push('Nomor telepon wajib diisi');
    if (!items || items.length === 0) errors.push('Keranjang belanja tidak boleh kosong');
    if (errors.length > 0) throw new Error(errors.join('; '));

    const db = getDb();
    const cache = {};
    for (const item of items) {
      const p = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!p) throw new Error(`Produk tidak ditemukan: ${item.product_id}`);
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 10)
        throw new Error(`Jumlah pembelian ${p.name} harus antara 1-10 unit`);
      if (qty > p.stock)
        throw new Error(`Stok ${p.name} tidak mencukupi. Tersedia: ${p.stock}`);
      cache[item.product_id] = p;
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    let totalPrice = 0;
    const orderItems = items.map(item => {
      const p = cache[item.product_id];
      totalPrice += p.price * item.quantity;
      return { id: uuidv4(), product: p, quantity: item.quantity };
    });

    db.transaction(() => {
      db.prepare(
        "INSERT INTO orders (id, user_id, recipient_name, shipping_address, phone, total_price, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)"
      ).run(id, userId, String(recipientName).trim(), String(shippingAddress).trim(), String(phone).trim(), totalPrice, now, now);
      for (const oi of orderItems) {
        db.prepare('INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)').run(
          oi.id, id, oi.product.id, oi.product.name, oi.product.price, oi.quantity
        );
        db.prepare('UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?').run(oi.quantity, now, oi.product.id);
      }
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
    })();

    return this.findById(id);
  }

  static updateStatus(id, newStatus) {
    const order = this.findById(id);
    if (!order) throw new Error('Pesanan tidak ditemukan');
    this.validateStatusTransition(order.status, newStatus);
    const now = new Date().toISOString();
    getDb().prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, id);
    if (newStatus === 'CANCELLED') {
      for (const item of order.items)
        getDb().prepare('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?').run(item.quantity, now, item.product_id);
    }
    return this.findById(id);
  }
}

module.exports = { Order, STATUS_TRANSITIONS, VALID_STATUSES };
