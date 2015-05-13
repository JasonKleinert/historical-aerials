const R = require('ramda');
const Joi = require('joi');
const Boom = require('boom');
const clog = require('clog');

const config = require('../../config');
const db = require('./../db')(config);  
const lib = require('../common');

const pickUserFields = R.pick(['id', 'emailAddress', 'Created', 'Modified']);

module.exports = (server, pathPrefix) => {
  server.route({
    method: 'GET',
    path: `${pathPrefix}/users/{id?}`,
    config: {
      validate: {
        params: {
          id: Joi.string().optional()
        },
        query: lib.pagingValidation
      }
    },
    handler: (request, reply) => {
      if (request.params.id) {
        db.getUser(request.params.id, (err, user) => {
          reply(pickUserFields(user));
        });
      }
      else {
        const options = R.pick(lib.pagingParams, request.query);
        db.getUsersCount(options, (err, count) => {
          db.getUsers(options, (err, users) => {
            reply(R.map(pickUserFields)(users))
              .header('X-Total-Count', count);
          });  
        });
      }
    }
  });


  server.route({
    method: 'PUT',
    path: `${pathPrefix}/users/{id?}`,
    config: {
      validate: {
        params: {
          id: Joi.string().required()
        },
        payload: {
          emailAddress: Joi.string().email().required(),
          password: Joi.string().min(6).allow('').optional(),
          repeatPassword: Joi.string().valid(Joi.ref('password')).optional(),
          id: Joi.any().strip()
        }
      }
    },
    handler: (request, reply) => {
      let payload = request.payload;
      if (payload.password === '') {
        delete payload.password;
        delete payload.repeatPassword;
      }
      if (payload.password && payload.password !== payload.repeatPassword) {
        return reply(Boom.badRequest('Repeat Password must match Password'));
      }
      
      db.updateUser(request.params.id, payload, (err, res) => {
        if (err) {
          clog.error(err);
          return reply(Boom.notFound('No user found for given ID'));
        }
        reply(res);
      });
    }
  });


  server.route({
    method: 'POST',
    path: `${pathPrefix}/users`,
    config: {
      validate: {
        payload: {
          emailAddress: Joi.string().email().required(),
          password: Joi.string().min(6).required(),
          repeatPassword: Joi.string().valid(Joi.ref('password')).required()
        }
      }
    },
    handler: (request, reply) => {
      db.createUser(request.payload, (err, userId) => {
        if (err) {
          clog.error(err);
          return reply(Boom.badImplementation('Unable to create new user'));
        }
        reply(userId);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: `${pathPrefix}/users/{id?}`,
    config: {
      validate: {
        params: {
          id: Joi.string().required()
        }
      }
    },
    handler: (request, reply) => {
      db.deleteUser(request.params.id, (err) => {
        if (err) {
          clog.error(err);
          return reply(Boom.notFound('No user found for given ID'));
        }
        return reply();
      });
    }
  });
};