if (!requireAuth()) throw new Error('unauthenticated');
updateCartBadge();
renderRoleBadge();

let cartItems = [];

async function loadSummary() {
  const { ok, data } = await Api.get('/cart');
  if (!ok || !data.data?.items?.length) {
    showToast('Keranjang kosong, silakan tambahkan produk terlebih dahulu', 'error');
    setTimeout(() => window.location.href = '/cart.html', 1500);
    return;
  }
  cartItems = data.data.items;
  const el = document.getElementById('orderSummary');
  el.innerHTML = `
    ${cartItems.map(i => `
      <div class="summary-row">
        <span>${i.name} <span style="color:var(--ink-muted-48)">×${i.quantity}</span></span>
        <span>${formatRupiah(i.subtotal)}</span>
      </div>`).join('')}
    <div class="summary-total" style="margin-top:12px">
      <span>Total</span><span>${formatRupiah(data.data.total)}</span>
    </div>`;
}

document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('checkoutBtn');
  const recipient = document.getElementById('recipientName').value.trim();
  const address = document.getElementById('shippingAddress').value.trim();
  const phone = document.getElementById('phone').value.trim();
  document.getElementById('recipientError').textContent = '';
  document.getElementById('addressError').textContent = '';
  document.getElementById('phoneError').textContent = '';
  document.getElementById('checkoutError').textContent = '';

  let valid = true;
  if (!recipient) { document.getElementById('recipientError').textContent = 'Nama penerima wajib diisi'; valid = false; }
  if (!address)   { document.getElementById('addressError').textContent = 'Alamat pengiriman wajib diisi'; valid = false; }
  if (!phone)     { document.getElementById('phoneError').textContent = 'Nomor telepon wajib diisi'; valid = false; }
  if (!valid) return;

  btn.textContent = 'Memproses...'; btn.disabled = true;
  const { ok, data } = await Api.post('/orders', {
    recipient_name: recipient,
    shipping_address: address,
    phone,
    items: cartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
  });
  btn.textContent = 'Konfirmasi Pesanan'; btn.disabled = false;
  if (ok) {
    showToast('Pesanan berhasil dibuat!', 'success');
    setTimeout(() => window.location.href = '/orders.html', 800);
  } else {
    document.getElementById('checkoutError').textContent = data.message || 'Gagal membuat pesanan';
  }
});

loadSummary();
