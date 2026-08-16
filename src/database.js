const BetterSqlite3 = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

let db = null;

function getDb() {
  if (!db) throw new Error('Database belum diinisialisasi. Panggil initializeDb() terlebih dahulu.');
  return db;
}

function closeDb() {
  if (db) { db.close(); db = null; }
}

function createTables(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT '',
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      image_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      phone TEXT NOT NULL,
      total_price REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);
}

function seedData(database) {
  if (database.prepare("SELECT id FROM users WHERE email = 'admin@tokomusik.com'").get()) return;

  database.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), 'admin', 'admin@tokomusik.com', bcrypt.hashSync('admin123', 10), 'admin'
  );
  database.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), 'user', 'user@tokomusik.com', bcrypt.hashSync('user123', 10), 'user'
  );

  const products = [
    { name: 'Gitar Akustik Yamaha F310', description: 'Gitar akustik entry-level terbaik untuk pemula, suara jernih dan nyaman dimainkan', category: 'Gitar', price: 1250000, stock: 10 },
    { name: 'Gitar Elektrik Squier Stratocaster', description: 'Gitar elektrik Fender Squier series, cocok untuk genre rock dan blues', category: 'Gitar', price: 3500000, stock: 5 },
    { name: 'Bass Elektrik Fender Precision', description: 'Bass elektrik klasik dengan karakter suara yang kuat dan tebal', category: 'Bass', price: 4200000, stock: 3 },
    { name: 'Drum Akustik Pearl Export', description: 'Set drum akustik 5-piece lengkap dengan hardware, cocok untuk studio latihan', category: 'Drum & Perkusi', price: 8500000, stock: 2 },
    { name: 'Keyboard Casio CTK-2500', description: 'Keyboard 61 tuts dengan 400 suara dan 150 ritme built-in, sempurna untuk belajar', category: 'Keyboard & Piano', price: 1800000, stock: 8 },
    { name: 'Ukulele Soprano Kala KA-15S', description: 'Ukulele soprano mahoni dengan suara hangat, ideal untuk pemula dan wisatawan', category: 'Ukulele', price: 750000, stock: 15 },
    { name: 'Violin 4/4 Stentor Student', description: 'Biola ukuran penuh untuk pelajar, termasuk busur dan kotak biola', category: 'Alat Gesek', price: 1100000, stock: 6 },
    { name: 'Harmonika Hohner Special 20 C', description: 'Harmonika diatonis nada C berkualitas tinggi, favorit para musisi blues', category: 'Alat Tiup', price: 450000, stock: 20 },
    { name: 'Cajon Meinl String', description: 'Cajon kayu dengan senar internal untuk efek snare yang crispy', category: 'Drum & Perkusi', price: 1600000, stock: 7 },
    { name: 'Pick Gitar Fender Medium (12pcs)', description: 'Paket 12 buah pick gitar Fender ketebalan medium, cocok untuk semua genre', category: 'Aksesori', price: 85000, stock: 50 },
  ];

  const ins = database.prepare('INSERT INTO products (id, name, description, category, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)');
  products.forEach(p => ins.run(uuidv4(), p.name, p.description, p.category, p.price, p.stock, p.image_url || ''));
}

function initializeDb(options = {}) {
  const { inMemory = false, dbPath = null } = options;
  if (db) closeDb();

  db = inMemory
    ? new BetterSqlite3(':memory:')
    : new BetterSqlite3(dbPath || path.join(__dirname, '..', 'toko-musik.db'));

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  createTables(db);
  if (!inMemory) seedData(db);
  return db;
}

module.exports = { getDb, closeDb, initializeDb, seedData, createTables };
