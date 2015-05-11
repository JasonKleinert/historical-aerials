const defaults = require('defaults');

const configDefaults = require('./defaults.json');
const isProd = process.env.NODE_ENV === 'production';

const configValues = isProd ? require('./production.json') : require('./development.json');

module.exports = defaults(configValues, configDefaults);
