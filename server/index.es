
const Hapi = require('hapi');
const swig = require('swig');
const clog = require('clog');
const basicAuth = require('hapi-auth-basic');

const logging = require('./logging');
const config = require('../config');
const auth = require('./auth');

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
        varControls: ["(>'.')>","<('.'<)"]
      }
    }
  },
  path: './server/views'
});

server.route({
  method: 'GET',
  path: '/static/{param*}',
  config: {
    auth: false
  },
  handler: {
    directory: {
      path: 'server/public/static'
    }
  }
});

server.register([logging, basicAuth], (err) => {
  if (err) {
    clog.error(err);
    return;
  }

  server.auth.strategy('simple', 'basic', 'required', 
    {validateFunc: auth.validate}
  );

  require('./routes/publicApi')(server, '/api/v1');
  require('./routes/admin')(server, '/admin');
  require('./routes/recordsApi')(server, '/admin/api');
  require('./routes/usersApi')(server, '/admin/api');

  server.start(() => {
    clog.info(`Server running at ${server.info.uri}`);
    clog.info(`Using Rethink db at ${config.db_host}:${config.db_port}`);
  });
});

