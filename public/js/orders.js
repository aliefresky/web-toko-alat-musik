if (!requireAuth()) throw new Error('unauthenticated');
updateCartBadge();
renderRoleBadge();

const isAdmin = Api.isAdmin();
if (isAdmin) {
  const el = document.getElementById('ordersSubTitle');
  if (el) el.textContent = 'Semua Pesanan (Admin)';
}

async function loadOrders() {
  const { ok, data } = await Api.get('/orders');
  if (!ok) { showToast('Gagal memuat pesanan', 'error'); return; }
  renderOrders(data.data);
}

function renderOrders(orders) {
  const el = document.getElementById('ordersContainer');
  if (!orders.length) {
    el.innerHTML = `<div class="empty-state">
      <span class="empty-icon">📦</span>
      <p>Belum ada pesanan</p>
      <a href="products.html" class="btn btn-primary">Mulai Belanja</a>
    </div>`;
    return;
  }
  el.innerHTML = `<div class="order-list">${orders.map(o => `
    <div class="order-card">
      <div class="order-row" onclick="toggleDetail('${o.id}')">
        <div class="order-meta">
          <div class="order-id">ID: ${o.id.substring(0, 8)}&hellip;${isAdmin ? ` &middot; user: ${o.user_id.substring(0,8)}&hellip;` : ''}</div>
          <div class="order-date">${new Date(o.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}</div>
        </div>
        <span class="badge badge-${o.status}">${o.status}</span>
        <div class="order-total">${formatRupiah(o.total_price)}</div>
        <span class="order-toggle">&#9662;</span>
      </div>
      <div class="order-body" id="detail-${o.id}">
        <dl class="order-detail-info">
          <dt>Penerima</dt><dd>${o.recipient_name}</dd>
          <dt>Telepon</dt><dd>${o.phone}</dd>
          <dt>Alamat</dt><dd>${o.shipping_address}</dd>
          <dt>Status</dt><dd><span class="badge badge-${o.status}">${o.status}</span></dd>
        </dl>
        <div id="items-${o.id}" style="margin-top:8px;color:var(--ink-muted-48);font-size:14px">Memuat item&hellip;</div>
        <div class="status-actions" id="actions-${o.id}"></div>
      </div>
    </div>`).join('')}</div>`;
}

async function toggleDetail(id) {
  const body = document.getElementById(`detail-${id}`);
  body.classList.toggle('open');
  if (body.classList.contains('open')) await loadDetail(id);
}

async function loadDetail(id) {
  const { ok, data } = await Api.get(`/orders/${id}`);
  if (!ok) return;
  const o = data.data;
  document.getElementById(`items-${id}`).innerHTML = `
    <table class="order-items-table">
      <thead><tr><th>Produk</th><th>Harga</th><th>Qty</th><th>Subtotal</th></tr></thead>
      <tbody>${o.items.map(i => `
        <tr>
          <td>${i.product_name}</td>
          <td>${formatRupiah(i.price)}</td>
          <td>${i.quantity}</td>
          <td>${formatRupiah(i.price * i.quantity)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  const transitions = { DRAFT: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['COMPLETED', 'CANCELLED'], COMPLETED: [], CANCELLED: [] };
  const next = transitions[o.status] || [];
  document.getElementById(`actions-${id}`).innerHTML = next.map(s => `
    <button class="btn btn-sm ${s === 'CANCELLED' ? 'btn-danger' : 'btn-utility'}"
      onclick="updateStatus('${id}', '${s}')">
      ${s === 'CONFIRMED' ? 'Konfirmasi' : s === 'COMPLETED' ? 'Selesai' : 'Batalkan'}
    </button>`).join('');
}

async function updateStatus(orderId, newStatus) {
  const { ok, data } = await Api.patch(`/orders/${orderId}/status`, { status: newStatus });
  if (ok) { showToast(`Status diubah ke ${newStatus}`, 'success'); loadOrders(); }
  else showToast(data.message || 'Gagal mengubah status', 'error');
}

loadOrders();
