const express = require('express');
const { Order } = require('../models/Order');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../database');

const router = express.Router();

router.use(authenticate);

router.post('/', (req, res) => {
  const { recipient_name, shipping_address, phone, items } = req.body;
  if (!items || items.length === 0)
    return res.status(400).json({ success: false, message: 'Keranjang belanja tidak boleh kosong' });
  try {
    const order = Order.create({ userId: req.user.id, recipientName: recipient_name, shippingAddress: shipping_address, phone, items });
    res.status(201).json({ success: true, message: 'Pesanan berhasil dibuat', data: order });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

router.get('/', (req, res) => {
  const orders = req.user.role === 'admin'
    ? getDb().prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
    : Order.findByUser(req.user.id);
  res.json({ success: true, data: orders });
});

router.get('/:id', (req, res) => {
  const order = Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  if (req.user.role !== 'admin' && order.user_id !== req.user.id)
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  res.json({ success: true, data: order });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'Status baru wajib diisi' });
  const order = Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  if (req.user.role !== 'admin' && order.user_id !== req.user.id)
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  try {
    const updated = Order.updateStatus(req.params.id, status);
    res.json({ success: true, message: `Status pesanan diubah ke ${status}`, data: updated });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;
