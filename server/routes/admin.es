
module.exports = (server, config, pathPrefix='') => {
  const db = require('./../db')(config);

  server.route({
    method: 'GET',
    path: pathPrefix + '/',
    handler: {
      file: 'server/public/admin/index.html'
    }
  });

  const apiPre = `${pathPrefix}/api`;

  server.route({
    method: 'GET',
    path: `${apiPre}/records/{id?}`,
    handler: (request, reply) => {
      if (request.params.id) {
        return reply({id: request.params.id, name: 'name for ' + request.params.id});
      }

      else {
        db.getRecords((err, records) => {
          reply(records);
        });
      }
    }
  });
};