const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

const MAX_QTY = 10;
const MIN_QTY = 1;

class Cart {
  static validateQuantity(quantity, stock) {
    const qty = Number(quantity);
    if (typeof quantity === 'string' && isNaN(Number(quantity))) throw new Error('Jumlah produk tidak boleh berupa teks');
    if (!Number.isInteger(qty)) throw new Error('Jumlah produk tidak boleh berupa pecahan');
    if (qty <= 0) throw new Error(`Jumlah minimal pembelian adalah ${MIN_QTY} unit`);
    if (qty > MAX_QTY) throw new Error(`Jumlah maksimal pembelian adalah ${MAX_QTY} unit untuk setiap produk`);
    if (stock !== undefined && qty > stock) throw new Error(`Jumlah pembelian tidak boleh melebihi stok yang tersedia (${stock})`);
    return true;
  }

  static getCart(userId) {
    const items = getDb().prepare(`
      SELECT ci.id, ci.product_id, ci.quantity,
             p.name, p.price, p.stock, p.description, p.category,
             (ci.quantity * p.price) AS subtotal
      FROM cart_items ci JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(userId);
    return { items, total: items.reduce((s, i) => s + i.subtotal, 0) };
  }

  static addItem(userId, productId, quantity) {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) throw new Error('Produk tidak ditemukan');
    const qty = Number(quantity);
    this.validateQuantity(qty, product.stock);
    const existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, productId);
    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > MAX_QTY) throw new Error(`Jumlah maksimal pembelian adalah ${MAX_QTY} unit untuk setiap produk`);
      if (newQty > product.stock) throw new Error(`Jumlah pembelian tidak boleh melebihi stok yang tersedia (${product.stock})`);
      db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?').run(newQty, userId, productId);
    } else {
      db.prepare('INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)').run(uuidv4(), userId, productId, qty);
    }
    return this.getCart(userId);
  }

  static updateItem(userId, productId, quantity) {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) throw new Error('Produk tidak ditemukan');
    const qty = Number(quantity);
    this.validateQuantity(qty, product.stock);
    if (!db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, productId))
      throw new Error('Item tidak ditemukan dalam keranjang');
    db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?').run(qty, userId, productId);
    return this.getCart(userId);
  }

  static removeItem(userId, productId) {
    getDb().prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(userId, productId);
    return this.getCart(userId);
  }

  static clearCart(userId) {
    getDb().prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
  }
}

module.exports = Cart;
