const Joi = require('joi');
const Boom = require('boom');
const R = require('ramda');

const pickRecordFields = R.pick(
  ['AcquiringAgency', 'CountyFIPS', 'Date', 'PrintType', 'Scale']
);

const pickCountyFields = R.pick(
  ['Name', 'FIPS']
);

module.exports = (server, config, pathPrefix='') => {
  const db = require('./../db')(config);

  server.route({
    method: 'GET',
    path: `${pathPrefix}/counties/{fips?}`,
    config: {
      validate: {
        params: {
          fips: Joi.number().integer().optional()
        }
      }
    },
    handler: (request, reply) => {
      if (request.params.fips) {
        db.getCountyByFips(request.params.fips, (err, result) => {
          if (!result) {
            return reply(Boom.notFound('No county found for given FIPS code'));
          }
          reply(pickCountyFields(result));
        });
      }
      else {
        db.getCounties((err, results) => {
          reply(R.map(pickCountyFields)(results));
        });
      }
    }
  });

  server.route({
    method: 'GET',
    path: `${pathPrefix}/records`,
    config: {
      validate: {
        query: {
          countyFips: Joi.number().integer().required()
        }
      }
    },
    handler: (request, reply) => {
      const countyFips = request.query.countyFips;
      db.getRecordsByCounty(countyFips, (err, results) => {
        if (!results.length) {
          return reply(Boom.notFound('No records found for given FIPS code'));
        }
        reply(R.map(pickRecordFields)(results));
      });
    }
  });

};