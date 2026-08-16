/**
 * TDD Unit Tests — Order State Machine & Order Model
 */
const { Order, STATUS_TRANSITIONS, VALID_STATUSES } = require('../../src/models/Order');
const { initializeDb, closeDb, seedData, getDb } = require('../../src/database');

beforeEach(() => {
  initializeDb({ inMemory: true });
  seedData(getDb());
});
afterEach(() => closeDb());

describe('Order.validateStatusTransition() — State Machine TDD', () => {

  // ─── RED: invalid transitions should throw ──────────────────────────

  describe('Fase RED — transisi yang TIDAK diizinkan', () => {
    test('DRAFT tidak bisa ke COMPLETED', () => {
      expect(() => Order.validateStatusTransition('DRAFT', 'COMPLETED')).toThrow();
    });

    test('COMPLETED tidak bisa ke CONFIRMED', () => {
      expect(() => Order.validateStatusTransition('COMPLETED', 'CONFIRMED')).toThrow();
    });

    test('COMPLETED tidak bisa ke CANCELLED', () => {
      expect(() => Order.validateStatusTransition('COMPLETED', 'CANCELLED')).toThrow();
    });

    test('CANCELLED tidak bisa ke CONFIRMED', () => {
      expect(() => Order.validateStatusTransition('CANCELLED', 'CONFIRMED')).toThrow();
    });

    test('CANCELLED tidak bisa ke COMPLETED', () => {
      expect(() => Order.validateStatusTransition('CANCELLED', 'COMPLETED')).toThrow();
    });

    test('CANCELLED tidak bisa ke DRAFT', () => {
      expect(() => Order.validateStatusTransition('CANCELLED', 'DRAFT')).toThrow();
    });

    test('CONFIRMED tidak bisa ke DRAFT', () => {
      expect(() => Order.validateStatusTransition('CONFIRMED', 'DRAFT')).toThrow();
    });

    test('Status yang tidak dikenal harus melempar error', () => {
      expect(() => Order.validateStatusTransition('DRAFT', 'INVALID_STATUS')).toThrow();
    });
  });

  // ─── GREEN: valid transitions should return true ────────────────────

  describe('Fase GREEN — transisi yang DIIZINKAN', () => {
    test('DRAFT bisa ke CONFIRMED', () => {
      expect(Order.validateStatusTransition('DRAFT', 'CONFIRMED')).toBe(true);
    });

    test('DRAFT bisa ke CANCELLED', () => {
      expect(Order.validateStatusTransition('DRAFT', 'CANCELLED')).toBe(true);
    });

    test('CONFIRMED bisa ke COMPLETED', () => {
      expect(Order.validateStatusTransition('CONFIRMED', 'COMPLETED')).toBe(true);
    });

    test('CONFIRMED bisa ke CANCELLED', () => {
      expect(Order.validateStatusTransition('CONFIRMED', 'CANCELLED')).toBe(true);
    });
  });

  // ─── REFACTOR: STATUS_TRANSITIONS map is correct ────────────────────

  describe('Fase REFACTOR — validasi struktur STATUS_TRANSITIONS', () => {
    test('STATUS_TRANSITIONS memiliki semua status valid sebagai kunci', () => {
      VALID_STATUSES.forEach(s => expect(STATUS_TRANSITIONS).toHaveProperty(s));
    });

    test('COMPLETED dan CANCELLED tidak memiliki transisi keluar (terminal states)', () => {
      expect(STATUS_TRANSITIONS.COMPLETED).toEqual([]);
      expect(STATUS_TRANSITIONS.CANCELLED).toEqual([]);
    });
  });

  // ─── Integration: Order.create() and updateStatus() ─────────────────

  describe('Integrasi Order CRUD', () => {
    function getSeedProduct() {
      return getDb().prepare('SELECT * FROM products WHERE stock > 0 LIMIT 1').get();
    }

    function getSeedUser() {
      return getDb().prepare("SELECT * FROM users WHERE email = 'user@tokomusik.com'").get();
    }

    test('Order.create() membuat pesanan DRAFT dengan benar', () => {
      const p = getSeedProduct();
      const u = getSeedUser();
      const order = Order.create({
        userId: u.id, recipientName: 'Budi Santoso',
        shippingAddress: 'Jl. Mawar No. 1 Makassar', phone: '081234567890',
        items: [{ product_id: p.id, quantity: 1 }],
      });
      expect(order.status).toBe('DRAFT');
      expect(order.items.length).toBe(1);
    });

    test('Order.create() mengurangi stok produk setelah checkout', () => {
      const p = getSeedProduct();
      const u = getSeedUser();
      const stockBefore = p.stock;
      Order.create({
        userId: u.id, recipientName: 'Test User', shippingAddress: 'Test Addr', phone: '08000',
        items: [{ product_id: p.id, quantity: 1 }],
      });
      const after = getDb().prepare('SELECT stock FROM products WHERE id = ?').get(p.id);
      expect(after.stock).toBe(stockBefore - 1);
    });

    test('Order.updateStatus() DRAFT → CONFIRMED berhasil', () => {
      const p = getSeedProduct();
      const u = getSeedUser();
      const order = Order.create({
        userId: u.id, recipientName: 'A', shippingAddress: 'B', phone: '08001',
        items: [{ product_id: p.id, quantity: 1 }],
      });
      const updated = Order.updateStatus(order.id, 'CONFIRMED');
      expect(updated.status).toBe('CONFIRMED');
    });

    test('Order.updateStatus() CANCELLED mengembalikan stok produk', () => {
      const p = getSeedProduct();
      const u = getSeedUser();
      const stockBefore = p.stock;
      const order = Order.create({
        userId: u.id, recipientName: 'A', shippingAddress: 'B', phone: '08002',
        items: [{ product_id: p.id, quantity: 1 }],
      });
      Order.updateStatus(order.id, 'CANCELLED');
      const after = getDb().prepare('SELECT stock FROM products WHERE id = ?').get(p.id);
      expect(after.stock).toBe(stockBefore);
    });

    test('Order.create() melempar error saat keranjang kosong', () => {
      const u = getSeedUser();
      expect(() => Order.create({ userId: u.id, recipientName: 'A', shippingAddress: 'B', phone: '08003', items: [] })).toThrow();
    });
  });
});
