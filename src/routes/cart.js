const express = require('express');
const Cart = require('../models/Cart');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res) => {
  res.json({ success: true, data: Cart.getCart(req.user.id) });
});

router.post('/', (req, res) => {
  const { product_id, quantity } = req.body;
  if (!product_id) return res.status(400).json({ success: false, message: 'product_id wajib diisi' });
  try {
    const cart = Cart.addItem(req.user.id, product_id, quantity);
    res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan ke keranjang', data: cart });
  } catch (e) {
    const status = e.message.includes('tidak ditemukan') ? 404 : 400;
    res.status(status).json({ success: false, message: e.message });
  }
});

router.patch('/:productId', (req, res) => {
  const { quantity } = req.body;
  try {
    const cart = Cart.updateItem(req.user.id, req.params.productId, quantity);
    res.json({ success: true, message: 'Keranjang berhasil diperbarui', data: cart });
  } catch (e) {
    const status = e.message.includes('tidak ditemukan') ? 404 : 400;
    res.status(status).json({ success: false, message: e.message });
  }
});

router.delete('/:productId', (req, res) => {
  const cart = Cart.removeItem(req.user.id, req.params.productId);
  res.json({ success: true, message: 'Item berhasil dihapus dari keranjang', data: cart });
});

router.delete('/', (req, res) => {
  Cart.clearCart(req.user.id);
  res.json({ success: true, message: 'Keranjang berhasil dikosongkan' });
});

module.exports = router;
