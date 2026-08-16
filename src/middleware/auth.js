const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'toko-musik-secret-2025';

function authenticate(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Token autentikasi diperlukan' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Token autentikasi diperlukan' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Akses ditolak: hanya admin yang dapat melakukan tindakan ini' });
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
  }
}

module.exports = { authenticate, requireAdmin, JWT_SECRET };
