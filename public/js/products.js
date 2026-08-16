if (!requireAuth()) throw new Error('unauthenticated');
updateCartBadge();
renderRoleBadge();

const isAdmin = Api.isAdmin();
if (isAdmin) document.getElementById('btnAddProduct').style.display = '';

let allProducts = [];

async function loadProducts() {
  const { ok, data } = await Api.get('/products');
  if (!ok) { showToast('Gagal memuat produk', 'error'); return; }
  allProducts = data.data;
  renderProducts(allProducts);
}

function renderProducts(list) {
  const el = document.getElementById('productsContainer');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><p>Tidak ada produk ditemukan</p></div>`;
    return;
  }
  el.innerHTML = `<div class="product-grid">${list.map(p => {
    const thumb = p.image_url
      ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML+='${getCategoryIcon(p.category)}'">`
      : getCategoryIcon(p.category);
    const safeName = p.name.replace(/'/g, "\\'");
    return `
    <div class="product-card">
      <div class="product-thumb">${thumb}</div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description || ''}</div>
        <div class="product-price">${formatRupiah(p.price)}</div>
        <div class="product-stock">${p.stock > 0 ? `Stok: ${p.stock}` : '<span style="color:var(--danger)">Stok habis</span>'}</div>
      </div>
      <div class="product-actions">
        ${p.stock > 0
          ? `<button class="btn btn-primary btn-sm" onclick="addToCart('${p.id}','${safeName}')">+ Keranjang</button>`
          : `<button class="btn btn-sm" disabled style="background:var(--divider-soft);color:var(--ink-muted-48)">Stok Habis</button>`
        }
        ${isAdmin ? `
        <div class="admin-card-actions">
          <button class="btn btn-utility btn-sm" style="flex:1" onclick="editProduct('${p.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" style="flex:1" onclick="deleteProduct('${p.id}','${safeName}')">Hapus</button>
        </div>` : ''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

async function addToCart(productId, name) {
  const { ok, data } = await Api.post('/cart', { product_id: productId, quantity: 1 });
  if (ok) {
    showToast(`${name} ditambahkan ke keranjang`, 'success');
    document.getElementById('cartBadge').textContent = data.data.items.length;
  } else {
    showToast(data.message || 'Gagal menambahkan', 'error');
  }
}

function filterProducts() {
  const q   = document.getElementById('searchInput').value.toLowerCase();
  const cat = document.getElementById('categoryFilter').value;
  renderProducts(allProducts.filter(p =>
    (!q   || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) &&
    (!cat || p.category === cat)
  ));
}

// ─── Admin: Modal ───────────────────────────────────────────────────
function openProductModal(product = null) {
  document.getElementById('pNameErr').textContent   = '';
  document.getElementById('pPriceErr').textContent  = '';
  document.getElementById('pStockErr').textContent  = '';
  document.getElementById('pFormErr').textContent   = '';
  if (product) {
    document.getElementById('modalTitle').textContent   = 'Edit Produk';
    document.getElementById('editProductId').value      = product.id;
    document.getElementById('pName').value              = product.name;
    document.getElementById('pCategory').value          = product.category;
    document.getElementById('pDescription').value       = product.description;
    document.getElementById('pPrice').value             = product.price;
    document.getElementById('pStock').value             = product.stock;
    document.getElementById('pImageUrl').value          = product.image_url || '';
    setImagePreview(product.image_url || '');
  } else {
    document.getElementById('modalTitle').textContent   = 'Tambah Produk';
    document.getElementById('editProductId').value      = '';
    document.getElementById('productForm').reset();
    setImagePreview('');
  }
  document.getElementById('productModal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden');
}

function setImagePreview(url) {
  const zone    = document.getElementById('uploadZone');
  const preview = document.getElementById('imagePreview');
  const img     = document.getElementById('previewImg');
  if (url) {
    img.src = url;
    preview.style.display = '';
    zone.style.display    = 'none';
  } else {
    preview.style.display = 'none';
    zone.style.display    = '';
    document.getElementById('pImageFile').value = '';
  }
}

function removeUploadedImage() {
  document.getElementById('pImageUrl').value = '';
  setImagePreview('');
}

async function uploadImageFile(file) {
  const formData = new FormData();
  formData.append('image', file);
  document.getElementById('uploadStatus').style.display = 'flex';
  document.getElementById('pSaveBtn').disabled = true;
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('pImageUrl').value = data.url;
      setImagePreview(data.url);
    } else {
      showToast(data.message || 'Upload gagal', 'error');
    }
  } catch {
    showToast('Gagal mengunggah gambar', 'error');
  } finally {
    document.getElementById('uploadStatus').style.display = 'none';
    document.getElementById('pSaveBtn').disabled = false;
  }
}

// Drag & drop
const uploadZone = document.getElementById('uploadZone');
uploadZone.addEventListener('dragover',  (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', ()  => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) uploadImageFile(file);
});
document.getElementById('pImageFile').addEventListener('change', (e) => {
  if (e.target.files[0]) uploadImageFile(e.target.files[0]);
});

function editProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (p) openProductModal(p);
}

async function deleteProduct(id, name) {
  if (!confirm(`Hapus produk "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
  const { ok, data } = await Api.delete(`/products/${id}`);
  if (ok) { showToast('Produk berhasil dihapus', 'success'); loadProducts(); }
  else showToast(data.message || 'Gagal menghapus', 'error');
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id   = document.getElementById('editProductId').value;
  const body = {
    name:        document.getElementById('pName').value.trim(),
    category:    document.getElementById('pCategory').value,
    description: document.getElementById('pDescription').value.trim(),
    price:       Number(document.getElementById('pPrice').value),
    stock:       Number(document.getElementById('pStock').value),
    image_url:   document.getElementById('pImageUrl').value.trim(),
  };
  document.getElementById('pSaveBtn').disabled = true;
  const { ok, data } = id
    ? await Api.patch(`/products/${id}`, body)
    : await Api.post('/products', body);
  document.getElementById('pSaveBtn').disabled = false;
  if (ok) {
    showToast(id ? 'Produk diperbarui' : 'Produk ditambahkan', 'success');
    closeProductModal();
    loadProducts();
  } else {
    document.getElementById('pFormErr').textContent = data.message || 'Gagal menyimpan';
  }
});

document.getElementById('searchInput').addEventListener('input', filterProducts);
document.getElementById('categoryFilter').addEventListener('change', filterProducts);

loadProducts();
