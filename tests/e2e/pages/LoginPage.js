class LoginPage {
  visit() { cy.visit('/login.html'); }

  typeEmail(email) { cy.get('#email').clear().type(email); }
  typePassword(password) { cy.get('#password').clear().type(password); }
  submit() { cy.get('#loginBtn').click(); }

  login(email, password) {
    this.visit();
    this.typeEmail(email);
    this.typePassword(password);
    this.submit();
  }

  getError(id = 'loginError') { return cy.get(`#${id}`); }
}

module.exports = new LoginPage();
