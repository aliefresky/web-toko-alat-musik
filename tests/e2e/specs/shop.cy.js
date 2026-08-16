/**
 * Cypress E2E Tests — Toko Alat Musik
 * Page Object Model Pattern — Min 8 UI test cases
 */
const LoginPage = require('../pages/LoginPage');
const ProductsPage = require('../pages/ProductsPage');
const CartPage = require('../pages/CartPage');
const CheckoutPage = require('../pages/CheckoutPage');

const USER_EMAIL = 'user@tokomusik.com';
const USER_PASS = 'user123';

// Helper: login via API to avoid UI login repetition
function loginViaApi() {
  cy.request('POST', '/api/auth/login', { email: USER_EMAIL, password: USER_PASS })
    .then(res => {
      window.localStorage.setItem('token', res.body.data.token);
      window.localStorage.setItem('user', JSON.stringify(res.body.data.user));
    });
}

// ─── TC-UI-01: Halaman login tampil dengan benar ──────────────────────
describe('TC-UI-01 | Halaman Login tampil dengan benar', () => {
  it('harus menampilkan form login, logo, dan hint akun demo', () => {
    LoginPage.visit();
    cy.get('.login-logo .icon').should('contain', '🎵');
    cy.get('#email').should('be.visible');
    cy.get('#password').should('be.visible');
    cy.get('#loginBtn').should('be.visible');
    cy.get('.demo-hint').should('be.visible');
  });
});

// ─── TC-UI-02: Login sukses redirect ke halaman produk ────────────────
describe('TC-UI-02 | Login sukses dengan kredensial valid', () => {
  it('harus redirect ke halaman produk setelah login', () => {
    LoginPage.login(USER_EMAIL, USER_PASS);
    cy.url().should('include', 'products.html');
    cy.get('.product-grid').should('exist');
  });
});

// ─── TC-UI-03: Login gagal dengan password salah ──────────────────────
describe('TC-UI-03 | Login gagal dengan password salah', () => {
  it('harus menampilkan pesan error', () => {
    LoginPage.visit();
    LoginPage.typeEmail(USER_EMAIL);
    LoginPage.typePassword('passwordsalah');
    LoginPage.submit();
    cy.get('#loginError').should('not.be.empty');
  });
});

// ─── TC-UI-04: Halaman produk menampilkan katalog ─────────────────────
describe('TC-UI-04 | Halaman produk menampilkan katalog alat musik', () => {
  beforeEach(() => {
    loginViaApi();
    cy.visit('/products.html');
  });

  it('harus menampilkan minimal 10 produk', () => {
    cy.get('.product-card').should('have.length.at.least', 10);
  });

  it('harus bisa filter berdasarkan kategori', () => {
    ProductsPage.filterByCategory('Gitar');
    cy.get('.product-card').each($card => {
      cy.wrap($card).find('.product-category').should('contain', 'Gitar');
    });
  });
});

// ─── TC-UI-05: Fitur pencarian produk ────────────────────────────────
describe('TC-UI-05 | Fitur pencarian produk', () => {
  beforeEach(() => {
    loginViaApi();
    cy.visit('/products.html');
  });

  it('harus memfilter produk saat mengetik di kolom pencarian', () => {
    ProductsPage.search('Gitar Akustik');
    cy.get('.product-card').should('have.length.at.least', 1);
    cy.get('.product-name').first().invoke('text').should('match', /gitar/i);
  });
});

// ─── TC-UI-06: Tambah produk ke keranjang ────────────────────────────
describe('TC-UI-06 | Menambahkan produk ke keranjang', () => {
  beforeEach(() => {
    loginViaApi();
    cy.visit('/products.html');
  });

  it('harus menambah item dan memperbarui badge keranjang', () => {
    cy.get('#cartBadge').invoke('text').then(before => {
      ProductsPage.addFirstProductToCart();
      cy.get('#cartBadge').invoke('text').should('not.equal', before);
    });
  });

  it('harus menampilkan toast notifikasi', () => {
    ProductsPage.addFirstProductToCart();
    cy.get('.toast').should('be.visible');
  });
});

// ─── TC-UI-07: Halaman keranjang ──────────────────────────────────────
describe('TC-UI-07 | Halaman keranjang belanja', () => {
  beforeEach(() => {
    loginViaApi();
    // Tambah produk dulu via API
    cy.request('GET', '/api/products').then(res => {
      cy.request({
        method: 'POST', url: '/api/cart',
        headers: { Authorization: `Bearer ${window.localStorage.getItem('token')}` },
        body: { product_id: res.body.data[0].id, quantity: 1 },
        failOnStatusCode: false,
      });
    });
    cy.visit('/cart.html');
  });

  it('harus menampilkan item yang ada di keranjang', () => {
    cy.get('.cart-table tbody tr').should('have.length.at.least', 1);
  });

  it('harus memiliki tombol Checkout yang menuju halaman checkout', () => {
    cy.contains('Checkout').should('be.visible').click();
    cy.url().should('include', 'checkout.html');
  });
});

// ─── TC-UI-08: Halaman checkout — validasi form ───────────────────────
describe('TC-UI-08 | Halaman checkout — validasi form', () => {
  beforeEach(() => {
    loginViaApi();
    cy.request('GET', '/api/products').then(res => {
      cy.request({
        method: 'POST', url: '/api/cart',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: { product_id: res.body.data[0].id, quantity: 1 },
        failOnStatusCode: false,
      });
    });
    cy.visit('/checkout.html');
  });

  it('harus menampilkan error saat submit tanpa isi nama penerima', () => {
    CheckoutPage.fillAddress('Jl. Merdeka No.1');
    CheckoutPage.fillPhone('081234567890');
    CheckoutPage.submit();
    cy.get('#recipientError').should('not.be.empty');
  });
});

// ─── TC-UI-09: Checkout end-to-end sukses ────────────────────────────
describe('TC-UI-09 | Checkout end-to-end sukses', () => {
  it('harus membuat pesanan dan redirect ke halaman pesanan', () => {
    LoginPage.login(USER_EMAIL, USER_PASS);
    cy.url().should('include', 'products.html');
    ProductsPage.addFirstProductToCart();
    cy.wait(500);
    cy.visit('/checkout.html');
    CheckoutPage.fill('Andi Tester', 'Jl. Diponegoro No. 5 Makassar', '081299887766');
    CheckoutPage.submit();
    cy.url().should('include', 'orders.html');
  });
});

// ─── TC-UI-10: Halaman pesanan menampilkan riwayat ───────────────────
describe('TC-UI-10 | Halaman pesanan menampilkan riwayat', () => {
  beforeEach(() => {
    loginViaApi();
  });

  it('harus bisa diakses dan menampilkan konten pesanan', () => {
    cy.visit('/orders.html');
    cy.get('#ordersContainer').should('exist');
    cy.get('.page-title').should('contain', 'Pesanan');
  });
});
