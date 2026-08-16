class CartPage {
  visit() { cy.visit('/cart.html'); }

  getItems() { return cy.get('.cart-table tbody tr'); }
  getCheckoutBtn() { return cy.contains('a', 'Checkout'); }
  getEmptyMessage() { return cy.get('.empty-cart'); }

  increaseQty() { cy.get('.qty-control button').eq(1).first().click(); }
  decreaseQty() { cy.get('.qty-control button').first().click(); }

  clickCheckout() { this.getCheckoutBtn().click(); }
}

module.exports = new CartPage();
