module.exports = {
  default: {
    paths: ['tests/bdd/features/**/*.feature'],
    require: ['tests/bdd/step_definitions/**/*.js'],
    format: ['progress-bar', 'json:reports/cucumber-report.json'],
    publishQuiet: true,
  },
};
