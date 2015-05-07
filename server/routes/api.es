const Joi = require('joi');
const Boom = require('boom');
const extend = require('extend');
const R = require('ramda');

const lib = require('../common');

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
        },
        query: lib.pagingValidation
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
        const options = R.pick(lib.pagingParams, request.query);
        db.getCountiesCount((err, count) => {
          db.getCounties(options, (err, results) => {
            reply(R.map(pickCountyFields)(results))
              .header('X-Total-Count', count);
          }); 
        });
      }
    }
  });

  server.route({
    method: 'GET',
    path: `${pathPrefix}/records`,
    config: {
      validate: {
        query: extend({
          countyFips: Joi.number().integer().required()
        }, lib.pagingValidation)
      }
    },
    handler: (request, reply) => {
      let options = R.pick(lib.pagingParams, request.query);
      options.filters ={
        'CountyFIPS': request.query.countyFips,
        'IsPublic': true
      };
      db.getRecords(options, (err, results) => {
        if (!results.length) {
          return reply(Boom.notFound('No records found for given FIPS code'));
        }
        reply(R.map(pickRecordFields)(results));
      });
    }
  });

};