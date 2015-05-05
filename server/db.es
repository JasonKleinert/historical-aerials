const assert = require('assert');
const rethink = require('rethinkdb');

const recordsTable = rethink.table('ImageryRecords');
const countiesTable = rethink.table('Counties');

function toArray(callback) {
  return (err, cursor) => {
    if (err) {
      throw err;
    }
    cursor.toArray((err, results) => {
      if (err) {
        throw err;
      }
      callback(null, results);
    });
  };
}

function toOne(callback) {
  return (err, cursor) => {
    if (err) {
      throw err;
    }
    cursor.toArray((err, results) => {
      if (err) {
        throw err;
      }

      if (results.length) {
        callback(null, results[0]);
      }
      else {
        callback(null, null);
      }
    });
  };
}

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


  getCounties(callback) {
    this.connectDb((err, conn) => {
      countiesTable.orderBy('Name').run(conn, toArray(callback));
    });
  }


  getCountyByFips(fips, callback) {
    this.connectDb((err, conn) => {
      countiesTable.filter({FIPS: fips}).limit(1)
        .run(conn, toOne(callback));
    });
  }


  getRecordsByCounty(countyFips, callback) {
    const matchFips = rethink.row('CountyFIPS').eq(countyFips);
    const isPublic = rethink.row('IsPublic').eq(true);
    this.connectDb((err, conn) => {
      recordsTable.filter(matchFips.and(isPublic)).orderBy('Date')
        .run(conn, toArray(callback));
    });
  }


  getRecords(callback) {
    this.connectDb((err, conn) => {
      recordsTable.run(conn, toArray(callback));
    });
  }


  getRecord(id, callback) {
    this.connectDb((err, conn) => {
      recordsTable.filter({id: id}).run(conn, toOne(callback));
    });
  }

}

module.exports = (config) => {
  return new HistoricalImageryDb(config);
};