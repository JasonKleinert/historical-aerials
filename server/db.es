const assert = require('assert');
const R = require('ramda');
const rethink = require('rethinkdb');

const table = rethink.table('AerialInfo');
const pickReturnFields = R.map(R.pick(
  ['AcquiringAgency', 'County', 'Date', 'PrintType', 'Scale']
));

class HistoricalImageryDb {
  constructor(config) {
    this.config = config;
  }

  connectDb(callback) {
    rethink.connect({
      host: this.config.db_host,
      port: this.config.db_port,
      db: this.config.db_name
    }, (err, connection) => {
      assert.ifError(err);
      callback(err, connection);
    });
  }

  getForCountyFips(countyFips, callback) {
    const matchFips = rethink.row('County')('FIPS').eq(countyFips);
    const isPublic = rethink.row('IsPublic').eq(true);
    this.connectDb((err, conn) => {
      table.filter(matchFips.and(isPublic)).orderBy('Date')
        .run(conn, (err, cursor) => {
          if (err) {
            throw err;
          }
          cursor.toArray((err, results) => {
            if (err) {
              throw err;
            }
            callback(null, pickReturnFields(results));
          });
        });
    });
  }
}

module.exports = (config) => {
  return new HistoricalImageryDb(config);
};