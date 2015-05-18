const defaults = require('defaults');

const configDefaults = require('./defaults.json');
const isProd = process.env.NODE_ENV === 'production';

let configValues = isProd ? require('./production.json') : require('./development.json');

// If linked Rethink container values are present in env, then use those
if (process.env.RDB_PORT_28015_TCP_ADDR && process.env.RDB_PORT_28015_TCP_PORT) {
  configValues.db_host = process.env.RDB_PORT_28015_TCP_ADDR;
  configValues.db_port = process.env.RDB_PORT_28015_TCP_PORT;
}

module.exports = defaults(configValues, configDefaults);
