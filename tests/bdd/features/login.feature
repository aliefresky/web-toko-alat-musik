Feature: User Login
  As a toko alat musik user
  I want to be able to login using email or username
  So that I can access shopping features

  Scenario: Login succeeds with email
    Given server is running and database is available
    When I send POST to "/api/auth/login" with body:
      | email    | user@tokomusik.com |
      | password | user123            |
    Then response status is 200
    And response has field "success" with value "true"
    And response has field "data.token"

  Scenario: Login succeeds with username
    Given server is running and database is available
    When I send POST to "/api/auth/login" with body:
      | username | admin    |
      | password | admin123 |
    Then response status is 200
    And response has field "data.token"

  Scenario: Login fails with wrong password
    Given server is running and database is available
    When I send POST to "/api/auth/login" with body:
      | email    | user@tokomusik.com |
      | password | salahsekali        |
    Then response status is 401
    And response has field "success" with value "false"

  Scenario: Login fails with unregistered email
    Given server is running and database is available
    When I send POST to "/api/auth/login" with body:
      | email    | tidakada@example.com |
      | password | password123          |
    Then response status is 401

  Scenario Outline: Login fails when fields are empty
    Given server is running and database is available
    When I send POST to "/api/auth/login" with email "<email>" and password "<password>"
    Then response status is <status>

    Examples:
      | email              | password | status |
      |                    | user123  | 400    |
      | user@tokomusik.com |          | 400    |
