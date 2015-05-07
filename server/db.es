const assert = require('assert');
const rethink = require('rethinkdb');

const recordsTable = rethink.table('ImageryRecords');
const countiesTable = rethink.table('Counties');

function paginate(selection, options) {
  if (!options) { 
    return selection;
  }

  if (options.sortField) {
    if (options.sortDir && options.sortDir.toUpperCase() === 'DESC') {
      selection = selection.orderBy(rethink.desc(options.sortField));
    }
    else {
      selection = selection.orderBy(rethink.asc(options.sortField));
    }
  }
  if (options.page && options.perPage) {
    selection = selection.skip(((options.page-1) * options.perPage))
      .limit(options.perPage);
  }
  return selection; //allow chaining of additional ReQL methods
}

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


  getCountiesCount(callback) {
    this.connectDb((err, conn) => {
      countiesTable.count().run(conn, (err, count) => {
        callback(null, count);
      });
    });
  }


  getCounties(options, callback) {
    if (arguments.length < 2) {
      callback = options;
    }
    this.connectDb((err, conn) => {
      paginate(countiesTable, options)
        .run(conn, toArray(callback));
    });
  }


  getCountyByFips(fips, callback) {
    this.connectDb((err, conn) => {
      countiesTable.filter({FIPS: fips}).limit(1)
        .run(conn, toOne(callback));
    });
  }


  getRecordsCount(options, callback) {
    this.connectDb((err, conn) => {
      let selection = recordsTable;
      if (options.filters) {
        selection = selection.filter(options.filters);
      }
      selection.count().run(conn, (err, count) => {
        callback(null, count);
      });
    });
  }

  getRecords(options, callback) {
    if (arguments.length < 2) {
      callback = options;
    }
    this.connectDb((err, conn) => {
      let selection = recordsTable;
      if (options.filters) {
        selection = selection.filter(options.filters);
      }
      paginate(selection, options)
        .run(conn, toArray(callback));
    });
  }


  getRecord(id, callback) {
    this.connectDb((err, conn) => {
      recordsTable.filter({id: id}).run(conn, toOne(callback));
    });
  }

  deleteRecord(id, callback) {
    this.connectDb((err, conn) => {
      recordsTable.get(id).delete().run(conn, callback);
    });
  }

}

module.exports = (config) => {
  return new HistoricalImageryDb(config);
};