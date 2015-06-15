const R = require('ramda');
const Joi = require('joi');
const Boom = require('boom');
const extend = require('extend');
const clog = require('clog');

const config = require('../../config');
const db = require('./../db')(config);  
const lib = require('../common');

module.exports = (server, pathPrefix) => {
  server.route({
    method: 'GET',
    path: `${pathPrefix}/records/{id?}`,
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
              Year: Joi.number().integer().min(1900),
              Mission: Joi.string()
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
    path: `${pathPrefix}/records/{id?}`,
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
    path: `${pathPrefix}/records`,
    config: {
      validate: {
        payload: lib.creationValidation
      }
    },
    handler: (request, reply) => {
      db.createRecord(request.payload, (err, newRecord) => {
        if (err) {
          clog.error(err);
          return reply(Boom.badImplementation('Unable to create new record'));
        }
        reply(newRecord);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: `${pathPrefix}/records/{id?}`,
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