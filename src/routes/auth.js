const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, username, password } = req.body;
  const id = email || username;
  if (!id || !password)
    return res.status(400).json({ success: false, message: 'Email/username dan password wajib diisi' });
  const user = getDb().prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(id, id);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ success: false, message: 'Email/username atau password salah' });
  const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ success: true, message: 'Login berhasil', data: { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } } });
});

router.get('/me', require('../middleware/auth').authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;
