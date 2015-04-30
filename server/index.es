const hapi = require('hapi');
const joi = require('joi');
const rethink = require('rethinkdb');
const clog = require('clog');

const config = require('./config');

const server = new hapi.Server();
server.connection({port: 3000});

server.route({
  method: 'GET',
  path: '/',
  handler: (request, reply) => {
    reply('Sup!');
  }
});

server.start(() => {
  clog.info(`Server running at ${server.info.uri}`);
});