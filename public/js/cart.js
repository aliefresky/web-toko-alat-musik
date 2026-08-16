if (!requireAuth()) throw new Error('unauthenticated');
updateCartBadge();
renderRoleBadge();

async function loadCart() {
  const { ok, data } = await Api.get('/cart');
  if (!ok) { showToast('Gagal memuat keranjang', 'error'); return; }
  renderCart(data.data);
}

function renderCart({ items, total }) {
  const el = document.getElementById('cartContainer');
  if (!items.length) {
    el.innerHTML = `<div class="empty-state">
      <span class="empty-icon">🛒</span>
      <p>Keranjang belanja kosong</p>
      <a href="products.html" class="btn btn-primary">Mulai Belanja</a>
    </div>`;
    return;
  }
  el.innerHTML = `<div class="cart-layout">
    <div class="cart-card">
      <table class="cart-table">
        <thead><tr><th>Produk</th><th>Harga</th><th>Jumlah</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>${items.map(item => `
          <tr>
            <td><strong>${item.name}</strong></td>
            <td>${formatRupiah(item.price)}</td>
            <td>
              <div class="qty-control">
                <button class="qty-btn" onclick="changeQty('${item.product_id}', ${item.quantity - 1})">&#8722;</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" onclick="changeQty('${item.product_id}', ${item.quantity + 1})">&#43;</button>
              </div>
            </td>
            <td><strong>${formatRupiah(item.subtotal)}</strong></td>
            <td><button class="btn btn-danger btn-sm" onclick="removeItem('${item.product_id}')" style="padding:6px 10px">&times;</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div>
      <div class="order-summary-card">
        <div class="section-label">Ringkasan</div>
        <div class="summary-row"><span>${items.length} produk</span><span>${formatRupiah(total)}</span></div>
        <div class="summary-row"><span>Pengiriman</span><span style="color:var(--success)">Gratis</span></div>
        <div class="summary-total"><span>Total</span><span>${formatRupiah(total)}</span></div>
        <a href="checkout.html" class="btn btn-primary btn-full" style="margin-top:16px;display:flex">Checkout</a>
        <button class="btn btn-secondary btn-full" style="margin-top:8px" onclick="clearCart()">Kosongkan Keranjang</button>
      </div>
    </div>
  </div>`;
}

async function changeQty(productId, qty) {
  if (qty < 1) { removeItem(productId); return; }
  const { ok, data } = await Api.patch(`/cart/${productId}`, { quantity: qty });
  if (ok) { renderCart(data.data); document.getElementById('cartBadge').textContent = data.data.items.length; }
  else showToast(data.message || 'Gagal memperbarui jumlah', 'error');
}

async function removeItem(productId) {
  const { ok, data } = await Api.delete(`/cart/${productId}`);
  if (ok) { renderCart(data.data); document.getElementById('cartBadge').textContent = data.data.items.length; showToast('Item dihapus', 'info'); }
  else showToast('Gagal menghapus item', 'error');
}

async function clearCart() {
  if (!confirm('Kosongkan seluruh keranjang?')) return;
  const { ok } = await Api.delete('/cart');
  if (ok) { showToast('Keranjang dikosongkan', 'info'); loadCart(); document.getElementById('cartBadge').textContent = 0; }
  else showToast('Gagal mengosongkan keranjang', 'error');
}

loadCart();
