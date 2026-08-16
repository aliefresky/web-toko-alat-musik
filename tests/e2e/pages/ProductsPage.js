class ProductsPage {
  visit() { cy.visit('/products.html'); }

  getProductCards() { return cy.get('.product-card'); }
  getSearchInput() { return cy.get('#searchInput'); }
  getCategoryFilter() { return cy.get('#categoryFilter'); }
  getCartBadge() { return cy.get('#cartBadge'); }

  search(query) { this.getSearchInput().clear().type(query); }
  filterByCategory(cat) { this.getCategoryFilter().select(cat); }

  addFirstProductToCart() {
    cy.get('.product-card .btn-primary').first().click();
  }
}

module.exports = new ProductsPage();
