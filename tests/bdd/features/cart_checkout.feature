Feature: Shopping Cart and Checkout
  As a toko alat musik customer
  I want to manage my cart and checkout
  So that I can buy the musical instruments I want

  Background:
    Given server is running and database is available
    And I am logged in as "user@tokomusik.com" with password "user123"

  Scenario: Add product to cart
    When I add the first product to cart with quantity 1
    Then response status is 201
    And cart has 1 item or more

  Scenario: Checkout succeeds with complete data
    Given I have items in the cart
    When I checkout with complete data
    Then response status is 201
    And order has status "DRAFT"
    And cart is cleared after checkout

  Scenario: Checkout fails when cart is empty
    When I send POST to "/api/orders" with empty items
    Then response status is 400

  Scenario Outline: Checkout fails with incomplete data
    Given I have items in the cart
    When I checkout with recipient_name "<name>" address "<address>" phone "<phone>"
    Then response status is 400

    Examples:
      | name         | address             | phone         |
      |              | Jl. Sudirman No. 1  | 081234567890  |
      | Budi Santoso |                     | 081234567890  |
      | Budi Santoso | Jl. Sudirman No. 1  |               |

  Scenario: Product quantity must not exceed maximum limit (10)
    When I add the first product to cart with quantity 11
    Then response status is 400

  Scenario: Product quantity must not be zero or negative
    When I add the first product to cart with quantity 0
    Then response status is 400

  Scenario: Change order status from DRAFT to CONFIRMED
    Given I have an order with status DRAFT
    When I change the order status to "CONFIRMED"
    Then response status is 200
    And order has status "CONFIRMED"

  Scenario: Cannot change order status from COMPLETED to CANCELLED
    Given I have an order with status COMPLETED
    When I change the order status to "CANCELLED"
    Then response status is 400
