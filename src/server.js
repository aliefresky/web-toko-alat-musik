try { require('dotenv').config(); } catch (_) {}
const { initializeDb, seedData, getDb } = require('./database');
const app = require('./app');

const PORT = process.env.PORT || 3000;

initializeDb();
// Seed on fresh DB
try { seedData(getDb()); } catch (_) {}

app.listen(PORT, () => {
  console.log(`\n🎵  Toko Alat Musik Server berjalan di http://localhost:${PORT}`);
  console.log(`    Akun demo:`);
  console.log(`    • admin@tokomusik.com / admin123`);
  console.log(`    • user@tokomusik.com  / user123\n`);
});
