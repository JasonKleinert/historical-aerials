
module.exports = {
  register: require('good'),
  options: {
    reporters: [{
      reporter: require('good-console'),
      events: {
        log: '*',
        error: '*'
      }
    }]
  }
};