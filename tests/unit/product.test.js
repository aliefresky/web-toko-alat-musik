/**
 * TDD Unit Tests — Product Model
 * Red → Green → Refactor
 */
const Product = require('../../src/models/Product');
const { initializeDb, closeDb, seedData, getDb } = require('../../src/database');

beforeEach(() => {
  initializeDb({ inMemory: true });
  seedData(getDb());
});
afterEach(() => closeDb());

describe('Product.validate() — TDD', () => {
  // ─── RED Phase: define expectations first ───────────────────────────

  describe('Fase RED — nama produk', () => {
    test('harus mengembalikan error saat nama kosong (string kosong)', () => {
      const errors = Product.validate({ name: '', price: 100000, stock: 5 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/nama/i);
    });

    test('harus mengembalikan error saat nama hanya spasi', () => {
      const errors = Product.validate({ name: '   ', price: 100000, stock: 5 });
      expect(errors.length).toBeGreaterThan(0);
    });

    test('harus mengembalikan error saat nama tidak ada (undefined)', () => {
      const errors = Product.validate({ price: 100000, stock: 5 });
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Fase RED — harga produk', () => {
    test('harus mengembalikan error saat harga adalah nol', () => {
      const errors = Product.validate({ name: 'Gitar', price: 0, stock: 5 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/harga/i);
    });

    test('harus mengembalikan error saat harga negatif', () => {
      const errors = Product.validate({ name: 'Gitar', price: -100, stock: 5 });
      expect(errors.length).toBeGreaterThan(0);
    });

    test('harus mengembalikan error saat harga berupa teks bukan angka', () => {
      const errors = Product.validate({ name: 'Gitar', price: 'mahal', stock: 5 });
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Fase RED — stok produk', () => {
    test('harus mengembalikan error saat stok negatif', () => {
      const errors = Product.validate({ name: 'Gitar', price: 100000, stock: -1 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/stok/i);
    });

    test('harus mengembalikan error saat stok berupa pecahan desimal', () => {
      const errors = Product.validate({ name: 'Gitar', price: 100000, stock: 2.5 });
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  // ─── GREEN Phase: valid data should pass ────────────────────────────

  describe('Fase GREEN — data valid', () => {
    test('harus mengembalikan array kosong untuk data produk yang valid', () => {
      const errors = Product.validate({ name: 'Gitar Akustik', price: 1500000, stock: 10 });
      expect(errors).toEqual([]);
    });

    test('harus valid ketika stok adalah nol (produk habis)', () => {
      const errors = Product.validate({ name: 'Gitar', price: 500000, stock: 0 });
      expect(errors).toEqual([]);
    });

    test('harus valid untuk produk aksesori murah', () => {
      const errors = Product.validate({ name: 'Pick Gitar', price: 5000, stock: 100 });
      expect(errors).toEqual([]);
    });
  });

  // ─── REFACTOR Phase: CRUD integration ───────────────────────────────

  describe('Fase REFACTOR — integrasi CRUD', () => {
    test('Product.create() berhasil menyimpan produk baru ke database', () => {
      const p = Product.create({ name: 'Gitar Test', price: 2000000, stock: 3, category: 'Gitar' });
      expect(p).toHaveProperty('id');
      expect(p.name).toBe('Gitar Test');
    });

    test('Product.create() melempar error saat data tidak valid', () => {
      expect(() => Product.create({ name: '', price: 0, stock: 5 })).toThrow();
    });

    test('Product.findAll() mengembalikan semua produk dari seed data', () => {
      const products = Product.findAll();
      expect(products.length).toBeGreaterThanOrEqual(10);
    });

    test('Product.findById() mengembalikan null untuk ID yang tidak ada', () => {
      expect(Product.findById('id-tidak-ada-xyz')).toBeNull();
    });

    test('Product.update() memperbarui hanya field yang dikirimkan (partial update)', () => {
      const created = Product.create({ name: 'Drum Test', price: 5000000, stock: 2 });
      const updated = Product.update(created.id, { price: 6000000 });
      expect(updated.price).toBe(6000000);
      expect(updated.name).toBe('Drum Test');
    });

    test('Product.delete() menghapus produk dari database', () => {
      const p = Product.create({ name: 'Violin Temp', price: 1000000, stock: 1 });
      Product.delete(p.id);
      expect(Product.findById(p.id)).toBeNull();
    });
  });
});
