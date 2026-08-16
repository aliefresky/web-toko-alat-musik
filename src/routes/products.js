const express = require('express');
const Product = require('../models/Product');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const products = Product.findAll();
  res.json({ success: true, data: products });
});

router.get('/:id', (req, res) => {
  const p = Product.findById(req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
  res.json({ success: true, data: p });
});

router.post('/', requireAdmin, (req, res) => {
  try {
    const p = Product.create(req.body);
    res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan', data: p });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

router.patch('/:id', requireAdmin, (req, res) => {
  try {
    const p = Product.update(req.params.id, req.body);
    res.json({ success: true, message: 'Produk berhasil diperbarui', data: p });
  } catch (e) {
    const status = e.message.includes('tidak ditemukan') ? 404 : 400;
    res.status(status).json({ success: false, message: e.message });
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  try {
    Product.delete(req.params.id);
    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (e) {
    res.status(404).json({ success: false, message: e.message });
  }
});

module.exports = router;
