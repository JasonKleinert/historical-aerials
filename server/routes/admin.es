const R = require('ramda');
const Joi = require('joi');

const lib = require('../common');

module.exports = (server, config, pathPrefix='') => {
  const db = require('./../db')(config);

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


  const apiPre = `${pathPrefix}/api`;

  //records?_page=1&_perPage=20&_sortDir=DESC&_sortField=id

  server.route({
    method: 'GET',
    path: `${apiPre}/records/{id?}`,
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
        db.getRecord(request.params.id, (err, record) => {
          reply(record);
        });
      }
      else {
        const options = R.pick(lib.pagingParams, request.query);
        db.getRecordsCount((err, count) => {
          db.getRecords(options, (err, records) => {
            reply(records)
              .header('X-Total-Count', count);
          });  
        });
      }
    }
  });
};