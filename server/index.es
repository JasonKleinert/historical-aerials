
const Hapi = require('hapi');
const swig = require('swig');
const clog = require('clog');

const logging = require('./logging');
const config = require('../config');

const server = new Hapi.Server();
server.connection({
  port: config.port,
  routes: {cors: true}
});

server.views({
  engines: {
    html: {
      module: swig,
      compileOptions: {
        varControls: ['{<','>}']
      }
    }
  },
  path: './server/views'
});


//TODO: alternative way of setting up routes: https://github.com/pamo/hapi-todo/
require('./routes/api')(server, config, '/api/v1');
require('./routes/admin')(server, config, '/admin');

server.route({
  method: 'GET',
  path: '/static/{param*}',
  handler: {
    directory: {
      path: 'server/public/static'
    }
  }
});

server.register([logging], (err) => {
  if (err) {
    clog.error(err);
  }
  else {
    server.start(() => {
      clog.info(`Server running at ${server.info.uri}`);
    });
  }
});

