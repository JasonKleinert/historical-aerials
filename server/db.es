const assert = require('assert');
const rethink = require('rethinkdb');
const R = require('ramda');

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

function filterRecords(selection, filterOpts) {
  let opts = R.clone(filterOpts);
  //special handling to filter by Year where we find records with Date
  // year greater than or equal to given Year
  if (opts.Year) {
    const year = parseInt(opts.Year, 10);
    selection = selection.hasFields(['Date']).filter(
      rethink.row('Date').year().ge(year)
    );
    delete opts.Year;
  }
  selection = selection.filter(opts);
  return selection;
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

  /**
  * Gets count of Counties
  */
  getCountiesCount(callback) {
    this.connectDb((err, conn) => {
      countiesTable.count().run(conn, (err, count) => {
        callback(null, count);
      });
    });
  }


  /**
  * Gets Counties, optionally paginated
  */
  getCounties(options, callback) {
    if (arguments.length < 2) {
      callback = options;
    }
    this.connectDb((err, conn) => {
      paginate(countiesTable, options)
        .run(conn, toArray(callback));
    });
  }

  /**
  * Gets County by its FIPS Code
  */
  getCountyByFips(fips, callback) {
    this.connectDb((err, conn) => {
      countiesTable.filter({FIPS: fips}).limit(1)
        .run(conn, toOne(callback));
    });
  }

  /**
  * Gets count of records, optionally filtered
  */
  getRecordsCount(options, callback) {
    this.connectDb((err, conn) => {
      let selection = recordsTable;
      if (options.filters) {
        selection = filterRecords(selection, options.filters);
      }
      selection.count().run(conn, (err, count) => {
        callback(null, count);
      });
    });
  }


  /**
  * Gets records, optionally filtered and paginated
  */
  getRecords(options, callback) {
    if (arguments.length < 2) {
      callback = options;
    }
    this.connectDb((err, conn) => {
      let selection = recordsTable;
      if (options.filters) {
        selection = filterRecords(selection, options.filters);
      }
      paginate(selection, options)
        .run(conn, toArray(callback));
    });
  }


  /**
  * Gets record identified by id
  */
  getRecord(id, callback) {
    this.connectDb((err, conn) => {
      recordsTable.filter({id: id}).run(conn, toOne(callback));
    });
  }


  /**
  * Updates record identified by id with values in params
  */
  updateRecord(id, params, callback) {
    this.connectDb((err, conn) => {
      recordsTable.get(id).update(params).run(conn, (err, res) => {
        if (err || !res.replaced) {
          callback(new Error(`Error updating ${id}`));
        }
        else {
          callback(null, res);
        }
      });
    });
  }


  /**
  * Deletes record identified by id
  */
  deleteRecord(id, callback) {
    this.connectDb((err, conn) => {
      recordsTable.get(id).delete().run(conn, (err, res) => {
        if (err || !res.deleted) {
          callback(new Error(`Error deleting ${id}`));
        }
        else {
          callback(null, res);
        }
      });
    });
  }

}

module.exports = (config) => {
  return new HistoricalImageryDb(config);
};