const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

class Product {
  static validate(data) {
    const errors = [];
    if (!data.name || String(data.name).trim() === '') errors.push('Nama produk wajib diisi');
    const price = Number(data.price);
    if (data.price === undefined || data.price === null || isNaN(price) || price <= 0)
      errors.push('Harga produk harus lebih besar dari nol');
    const stock = Number(data.stock);
    if (data.stock === undefined || data.stock === null || isNaN(stock) || stock < 0 || !Number.isInteger(stock))
      errors.push('Stok tidak boleh bernilai negatif dan harus berupa bilangan bulat');
    return errors;
  }

  static findAll() {
    return getDb().prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  }

  static findById(id) {
    return getDb().prepare('SELECT * FROM products WHERE id = ?').get(id) || null;
  }

  static create(data) {
    const errors = this.validate(data);
    if (errors.length > 0) throw new Error(errors.join('; '));
    const id = uuidv4();
    const now = new Date().toISOString();
    getDb().prepare(
      'INSERT INTO products (id, name, description, category, price, stock, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, String(data.name).trim(), data.description || '', data.category || '', Number(data.price), Number(data.stock), data.image_url || '', now, now);
    return this.findById(id);
  }

  static update(id, data) {
    const existing = this.findById(id);
    if (!existing) throw new Error('Produk tidak ditemukan');
    const merged = {
      name: data.name !== undefined ? data.name : existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      category: data.category !== undefined ? data.category : existing.category,
      price: data.price !== undefined ? data.price : existing.price,
      stock: data.stock !== undefined ? data.stock : existing.stock,
      image_url: data.image_url !== undefined ? data.image_url : existing.image_url,
    };
    const errors = this.validate(merged);
    if (errors.length > 0) throw new Error(errors.join('; '));
    getDb().prepare(
      'UPDATE products SET name=?, description=?, category=?, price=?, stock=?, image_url=?, updated_at=? WHERE id=?'
    ).run(String(merged.name).trim(), merged.description, merged.category, Number(merged.price), Number(merged.stock), merged.image_url || '', new Date().toISOString(), id);
    return this.findById(id);
  }

  static delete(id) {
    if (!this.findById(id)) throw new Error('Produk tidak ditemukan');
    getDb().prepare('DELETE FROM products WHERE id = ?').run(id);
    return true;
  }
}

module.exports = Product;
