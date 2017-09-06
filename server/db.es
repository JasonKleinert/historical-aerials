const assert = require('assert');
const rethink = require('rethinkdb');
const R = require('ramda');
const defaults = require('defaults');
const bcrypt = require('bcrypt');
const clog = require('clog');

const usersTable = rethink.table('Users');
const recordsTable = rethink.table('ImageryRecords');
const countiesTable = rethink.table('Counties');

function hashPassword(password) {
  const salt = bcrypt.genSaltSync();
  const hashedPassword = bcrypt.hashSync(password, salt);
  return hashedPassword;
}

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
  if (!filterOpts) {
    return selection;
  }
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
  //special handling for case insensitive Mission codes
  if (opts.Mission) {
    selection = selection.filter(
      rethink.row('Mission').match(`(?i)^${opts.Mission}$`)
    );
    delete opts.Mission;
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

  getOne(table) {
    //params should be a reql query object, like {id: 123}
    return (params, callback) => {
      this.connectDb((err, conn) => {
        table.filter(params).limit(1).run(conn, toOne(callback));
      });
    };
  }

  deleteOne(table) {
    return (id, callback) => {
      this.connectDb((err, conn) => {
        table.get(id).delete().run(conn, (err, res) => {
          if (err || !res.deleted) {
            if (err) { clog.error(err); }
            callback(new Error(`Error deleting ${id}`));
          }
          else {
            callback(null, res);
          }
        });
      });
    };
  }

  getCount(table) {
    return (options, callback) => {
      this.connectDb((err, conn) => {
        let selection = table;
        if (options.filters) {
          selection = filterRecords(selection, options.filters);
        }
        selection.count().run(conn, (err, count) => {
          callback(null, count);
        });
      });
    };
  }

  getMultiple(table) {
    return (options, callback) => {
      if (!callback) {
        callback = options;
        options = {};
      }
      this.connectDb((err, conn) => {
        let selection = table;
        if (options.filters) {
          selection = filterRecords(selection, options.filters);
        }
        paginate(selection, options)
          .run(conn, toArray(callback));
      });
    };
  }


  /**
  * Gets Users
  */
  getUsers(options, callback) {
    this.getMultiple(usersTable.without('password'))(options, callback);
  }

  /**
  * Gets count of all users
  */
  getUsersCount(options, callback) {
    this.getCount(usersTable)(options, callback);
  }

  /**
  * Gets User by id
  */
  getUser(id, callback) {
    this.getOne(usersTable.without('password'))({id}, callback);
  }

  getUserByEmailWithPassword(emailAddress, callback) {
    this.connectDb((err, conn) => {
      rethink.table('Users').filter({emailAddress}).limit(1).run(conn, toOne(callback));
    });
  }

  createUser(params, callback) {
    if (!params.emailAddress || !params.password) {
      throw new Error('Missing required emailAddress and password params');
    }
    this.connectDb((err, conn) => {
      const createParams = {
        emailAddress: params.emailAddress,
        password: hashPassword(params.password),
        Created: new Date(),
        Modified: new Date()
      };

      usersTable.insert(createParams).run(conn, (err, res) => {
        if (err || !res.inserted || !res.generated_keys.length) {
          if (err) { clog.error(err); }
          clog.debug(res);
          callback(new Error('Error creating new user'));
        }
        else {
          this.getUser(res.generated_keys[0], callback);
        }
      });
    });
  }

  updateUser(id, params, callback) {
    this.connectDb((err, conn) => {
      let updateParams = {
        Modified: new Date()
      };

      if (params.password) {
        updateParams.password = hashPassword(params.password);
      }
      if (params.emailAddress) {
        updateParams.emailAddress = params.emailAddress;
      }

      usersTable.get(id).update(updateParams).run(conn, (err, res) => {
        if (err || !res.replaced) {
          if (err) { clog.error(err); }
          callback(new Error(`Error updating ${id}`));
        }
        else {
          this.getUser(id, callback);
        }
      });
    });
  }

  deleteUser(id, callback) {
    this.deleteOne(usersTable)(id, callback);
  }


  /**
  * Gets count of Counties
  */
  getCountiesCount(callback) {
    this.getCount(countiesTable)({}, callback);
  }


  /**
  * Gets Counties, optionally paginated
  */
  getCounties(options, callback) {
    this.getMultiple(countiesTable)(options, callback);
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
    this.getCount(recordsTable)(options, callback);
  }


  /**
  * Gets records, optionally filtered and paginated
  */
  getRecords(options, callback) {
    this.getMultiple(recordsTable)(options, callback);
  }


  /**
  * Gets record identified by id
  */
  getRecord(id, callback) {
    this.getOne(recordsTable)({id}, callback);
  }


  /**
  * Creates record with values in params
  */
  createRecord(params, callback) {
    this.connectDb((err, conn) => {

      const createParams = defaults({
        Created: new Date(),
        Modified: new Date()
      }, params);

      recordsTable.insert(createParams).run(conn, (err, res) => {
        if (err || !res.inserted || !res.generated_keys.length) {
          if (err) { clog.error(err); }
          callback(new Error('Error creating new record'));
        }
        else {
          this.getRecord(res.generated_keys[0], callback);
        }
      });
    });
  }


  /**
  * Updates record identified by id with values in params
  */
  updateRecord(id, params, callback) {
    this.connectDb((err, conn) => {
      //new params with modified date
      const updateParams = defaults(
        {Modified: new Date()},
        R.omit(['id', 'Created', 'OrigDBNumber'], params)
      );

      recordsTable.get(id).update(updateParams).run(conn, (err, res) => {
        if (err || !res.replaced) {
          callback(new Error(`Error updating ${id}`));
        }
        else {
          this.getRecord(id, callback);
        }
      });
    });
  }


  /**
  * Deletes record identified by id
  */
  deleteRecord(id, callback) {
    this.deleteOne(recordsTable)(id, callback);
  }

}

module.exports = (config) => {
  return new HistoricalImageryDb(config);
};
