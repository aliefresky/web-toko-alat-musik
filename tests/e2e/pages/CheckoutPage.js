class CheckoutPage {
  visit() { cy.visit('/checkout.html'); }

  fillRecipientName(name) { cy.get('#recipientName').clear().type(name); }
  fillAddress(address) { cy.get('#shippingAddress').clear().type(address); }
  fillPhone(phone) { cy.get('#phone').clear().type(phone); }
  submit() { cy.get('#checkoutBtn').click(); }

  fill(name, address, phone) {
    this.fillRecipientName(name);
    this.fillAddress(address);
    this.fillPhone(phone);
  }

  getError(id = 'checkoutError') { return cy.get(`#${id}`); }
}

module.exports = new CheckoutPage();
