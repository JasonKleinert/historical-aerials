const R = require('ramda');
const Joi = require('joi');
const Boom = require('boom');
const extend = require('extend');
const clog = require('clog');

const lib = require('../common');

module.exports = (server, config, pathPrefix='') => {
  const db = require('./../db')(config);
  const apiPre = `${pathPrefix}/api`;

  server.route({
    method: 'GET',
    path: pathPrefix,
    handler: (request, reply) => {

      db.getCounties((err, results) => {

        const countiesByFips = results.reduce((counties, county) => {
          counties[county.FIPS] = county.Name;
          return counties;
        }, {});

        reply.view('admin/index', {
          counties: countiesByFips
        }); 
      });

    }
  });


  server.route({
    method: 'GET',
    path: `${apiPre}/records/{id?}`,
    config: {
      validate: {
        params: {
          id: Joi.string().optional()
        },
        query: extend({
          filters: Joi.object().optional()
            .keys({
              CountyFIPS: Joi.number(),
              IsPublic: Joi.boolean(),
              Year: Joi.number().integer().min(1900)
            })
        }, lib.pagingValidation)
      }
    },
    handler: (request, reply) => {
      if (request.params.id) {
        db.getRecord(request.params.id, (err, record) => {
          reply(record);
        });
      }
      else {
        const validOptions = ['filters'].concat(lib.pagingParams);
        const options = R.pick(validOptions, request.query);
        db.getRecordsCount(options, (err, count) => {
          db.getRecords(options, (err, records) => {
            reply(records)
              .header('X-Total-Count', count);
          });  
        });
      }
    }
  });


  server.route({
    method: 'PUT',
    path: `${apiPre}/records/{id?}`,
    config: {
      validate: {
        params: {
          id: Joi.string().required()
        },
        payload: extend({
          Created: Joi.any().strip(),
          Modified: Joi.any().strip(),
          id: Joi.any().strip()
        }, lib.creationValidation)
      }
    },
    handler: (request, reply) => {
      db.updateRecord(request.params.id, request.payload, (err, res) => {
        if (err) {
          clog.error(err);
          return reply(Boom.notFound('No record found for given ID'));
        }
        reply(res);
      });
    }
  });


  server.route({
    method: 'POST',
    path: `${apiPre}/records`,
    config: {
      validate: {
        payload: lib.creationValidation
      }
    },
    handler: (request, reply) => {
      clog.info(request.payload);
      db.createRecord(request.payload, (err, recordId) => {
        if (err) {
          clog.error(err);
          return reply(Boom.badImplementation('Unable to create new record'));
        }
        reply(recordId);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: `${apiPre}/records/{id?}`,
    config: {
      validate: {
        params: {
          id: Joi.string().required()
        }
      }
    },
    handler: (request, reply) => {
      db.deleteRecord(request.params.id, (err) => {
        if (err) {
          clog.error(err);
          return reply(Boom.notFound('No record found for given ID'));
        }
        return reply();
      });
    }
  });

};