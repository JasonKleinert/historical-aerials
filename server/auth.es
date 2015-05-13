const bcrypt = require('bcrypt');

const config = require('../config');
const db = require('./db')(config);

const rootAdmin = 'admin';
const rootPassword = config.adminPassword;

if (!rootPassword) {
  throw new Error("Must specify adminPassword in config");
}

function validate(emailAddress, password, callback) {
  if (emailAddress === rootAdmin && password === rootPassword) {
    callback(null, true, {id: 0, name: 'admin'});
    return;
  }

  db.getUserByEmailWithPassword(emailAddress, (err, user) => {
    if (err || !user) {
      callback(null, false);
      return;
    }

    bcrypt.compare(password, user.password, (err, isValid) => {
      if (err) {
        callback(null, false);
        return;
      }
      callback(null, !!isValid, {id: user.id, name: user.emailAddress});
    });

  });

}

module.exports = {
  validate: validate
};