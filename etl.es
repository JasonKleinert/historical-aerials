/*
  ETL script to load data from the original Access database
  of aerial imagery into new Rethink database.
*/
const fs = require('fs');
const assert = require('assert');
const mdb = require('mdb');
const async = require('async');
const csv = require('dsv').csv;
const clog = require('clog');
const rethink = require('rethinkdb');
const tryparse = require('tryparse');
const R = require('ramda');

const config = require('./config');

const accessDb = mdb('./data/Aerial_database_20150504.accdb');
const accessTable = 'Aerial_Info';

const rdbTable = 'ImageryRecords';
const rdbCountiesTable = 'Counties';
const rdbUsersTable = 'Users';
const rdbName = config.db_name;

// Array of existing entry DB_No IDs that can be skipped for ETL
const recordsToSkip = [3684];

const countyFips = (() => {
  const contents = fs.readFileSync('./data/st48_tx_cou.txt', 'utf-8');
  const rows = csv.parseRows(contents);
  return rows.map(function (row) {
    return {
      FIPS: tryparse.int(row[1] + row[2]),
      Name: row[3].replace(' County', '')
    };
  });
})();


const acquiringAgencyNames = require('./data/acquiringAgencies.json');
const badCountyNameMap = require('./data/badCounties.json');
const badMediumNameMap = require('./data/badMediums.json');


async.waterfall([
  setupDb,
  loadCounties,
  getSourceRecords,
  removeUnwantedRecords,
  translateRecords
]);


function connectDb(cb) {
  rethink.connect({
    host: config.db_host,
    port: config.db_port,
    db: config.db_name
  }, (err, connection) => {
    assert.ifError(err);
    cb(err, connection);
  });
}


function dropAndCreate(tableName, connection, callback) {
  rethink.tableDrop(tableName).run(connection, () => {
    rethink.tableCreate(tableName).run(connection, () => {
      clog.info(`Dropped (if it existed) and created table [${rdbName}.${tableName}]`);
      callback(null);
    });
  });
}

function setupDb(callback) {
  connectDb((err, connection) => {
    assert.ifError(err);
    rethink.dbCreate(rdbName).run(connection, (err) => {
      if (err) {
        clog.info(`Database [${rdbName}] already exists`);
      }
      else {
        clog.info(`Created Database [${rdbName}]`);
      }

      async.parallel([
        (cb) => {
          dropAndCreate(rdbTable, connection, cb);
        },
        (cb) => {
          dropAndCreate(rdbCountiesTable, connection, cb);
        },
        (cb) => {
          dropAndCreate(rdbUsersTable, connection, cb);
        }
      ], () => {
        connection.close();
        callback(null);
      });
    });
  });
}

//TODO: Load counties separately, then just FK to FIPS code in the
// imagery records
function loadCounties(callback) {
  insertRecords(countyFips, rdbCountiesTable, callback);
}


function getSourceRecords(callback) {
  accessDb.toCSV(accessTable, (err, contents) => {
    assert.ifError(err);
    const rows = csv.parse(contents);
    clog.info(`Read ${rows.length} rows from source table`);
    callback(null, rows);
  });
}


function removeUnwantedRecords(rows, callback) {
  clog.info(`Removing records with DB_No in [${recordsToSkip.join(', ')}]`);
  const filteredRows = rows.filter((row) => {
    return recordsToSkip.indexOf(tryparse.int(row.DB_No)) === -1;
  });
  callback(null, filteredRows);
}


function parseDate(str, dbNo) {
  const d = new Date(str);
  if (isNaN(d)) {
    clog.debug(`Invalid date "${str}" (DB_No ${dbNo})`);
    return null;
  }
  return d;
}


function findCounty(name, dbNo) {
  const foundVal = R.find((cf) => {
    return upper(name) === upper(cf.Name);
  }, countyFips);

  if (foundVal) { 
    return foundVal;
  }

  //else
  clog.debug(`Unable to find county "${name}" (DB_No ${dbNo}). Using badCountyNameMap.`);
  
  const foundGoodName = badCountyNameMap[name];

  if (!foundGoodName) {
    clog.error(`Still unable to find "${name}". Aborting.`);
    throw new Error(`Unable to find county "${name}"`);
  }

  return findCounty(foundGoodName, dbNo);
}


function trim(str) {
  return String.prototype.trim.call(str);
}

function upper(str) {
  return String.prototype.toUpperCase.call(str);
}

function getAgency(agencyName) {
  const newName = acquiringAgencyNames[agencyName];
  return newName || "Other";
}

function getMedium(medium) {
  medium = upper(medium);
  return badMediumNameMap[medium] || medium;
}


function translateRecords(rows, callback) {
  const newRows = rows.map((row) => {
    return {
      AcquiringAgency: getAgency(row.Aquire_Agency),
      // CanisterNo: row.Canister_No, //NOT NEEDED - always blank
      CountyFIPS: findCounty(row.County, row.DB_No).FIPS, 
      Coverage: upper(row.Coverage) === 'Y',
      OrigDBNumber: tryparse.int(row.DB_No), //original Access PK
      Date: parseDate(row.Date, row.DB_No),
      // FirstFrame: tryparse.int(row.First_frame), //NOT NEEDED - unused generally
      FrameSize: tryparse.int(row.Format),
      IndexType: row.Index_type,
      LocationCode: row.Location_code, //internal location index/code
      Mission: row.MSN,
      Medium: getMedium(row.Medium),
      NumFrames: tryparse.int(row.No_of_frames),
      // IsPositive: row.Pos_Neg === "POS", //NOT NEEDED - not relevant
      PrintType: upper(row.Print_type), //B&W, CIR (color infrared), COL (color)
      RSDIS: tryparse.int(row.RSDIS), //Old index system
      Remarks: trim(row.Remarks),
      Scale: tryparse.int(row.Scale),
      IsPublic: upper(row.Security_status) === 'PUBLIC',
      Created: new Date(),
      Modified: new Date()
    };
  });

  insertRecords(newRows, rdbTable, callback);
}


function insertRecords(rows, tableName, callback) {
  connectDb((err, connection) => {
    rethink.table(tableName)
      .insert(rows)
      .run(connection, (err, result) => {
        assert.ifError(err);
        assert.ok(result.errors === 0, 'There were errors while inserting records');
        clog.info(`Inserted ${result.inserted} records into [${rdbName}.${tableName}]`);
        connection.close();
        callback(null);
      });
  });
}

