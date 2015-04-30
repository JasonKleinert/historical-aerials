
const Hapi = require('hapi');
const Joi = require('joi');
const Boom = require('boom');
const clog = require('clog');

const config = require('./config');
const db = require('./db')(config);

const server = new Hapi.Server();
server.connection({port: config.port});

server.route({
  method: 'GET',
  path: '/imagery',
  config: {
    validate: {
      query: {
        countyFips: Joi.number().required()
      }
    }
  },
  handler: (request, reply) => {
    const countyFips = request.query.countyFips;
    db.getForCountyFips(countyFips, (err, results) => {
      if (!results.length) {
        return reply(Boom.notFound('No data found for given FIPS code'));
      }
      reply(results);
    });
  }
});

server.start(() => {
  clog.info(`Server running at ${server.info.uri}`);
});