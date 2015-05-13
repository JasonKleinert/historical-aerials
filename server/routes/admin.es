
const config = require('../../config');
const db = require('./../db')(config);  

module.exports = (server, pathPrefix) => {
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
};