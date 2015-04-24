

const assert = require('assert');
const mdb = require('mdb');
const async = require('async');
const csv = require('dsv')(',');
const clog = require('clog');
const rethink = require('rethinkdb');
const tryparse = require('tryparse');
const R = require('ramda');

const accessDb = mdb('Aerial_database.accdb');
const accessTable = 'Aerial_Info';

const rdbName = 'AerialImagery';
const rdbTable = 'AerialInfo';

function connectDb(cb) {
  rethink.connect({
    host: 'localhost',
    port: 28015,
    db: rdbName
  }, (err, connection) => {
    assert.ifError(err);
    cb(err, connection);
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

      rethink.tableDrop(rdbTable).run(connection, () => {
        rethink.tableCreate(rdbTable).run(connection, (err, result) => {
          clog.info(`Dropped (if it existed) and created table [${rdbName}.${rdbTable}]`);
          connection.close();
          callback(null, result);
        });
      });
    });
  });
}

function getSourceRecords(setupResult, callback) {
  accessDb.toCSV(accessTable, (err, contents) => {
    assert.ifError(err);
    const rows = csv.parse(contents);
    clog.info(`Read ${rows.length} rows from source table`);
    callback(null, rows);
  });
}


function parseDate(str) {
  const d = new Date(str);
  return isNaN(d) ? null : d;
}

function translateRecords(rows, callback) {
  const newRows = rows.map((row) => {
    return {
      AcquiringAgency: row.Aquire_Agency,
      // CanisterNo: row.Canister_No, //NOT NEEDED - always blank
      County: row.County,
      Coverage: row.Coverage.toUpperCase() === 'Y',
      // DBNumber: tryparse.int(row.DB_No), //NOT NEEDED - Access database internal key
      Date: parseDate(row.Date),
      // FirstFrame: tryparse.int(row.First_frame), //NOT NEEDED - unused generally
      Format: tryparse.int(row.Format),
      IndexType: row.Index_type,
      LocationCode: row.Location_code, //internal location index/code
      MissionNum: row.MSN,
      Medium: row.Medium.toUpperCase(),
      NumFrames: tryparse.int(row.No_of_frames),
      // IsPositive: row.Pos_Neg === "POS", //NOT NEEDED - not relevant
      PrintType: row.Print_type.toUpperCase(), //B&W, CIR (color infrared), COL (color)
      RSDIS: tryparse.int(row.RSDIS), //Old index system
      Remarks: row.Remarks.trim(),
      Scale: tryparse.int(row.Scale),
      IsPublic: row.Security_status.toUpperCase() === "PUBLIC"
    };
  });
  callback(null, newRows);
}

function insertRecords(rows, callback) {
  connectDb((err, connection) => {
    rethink.table(rdbTable)
      .insert(rows)
      .run(connection, (err, result) => {
        assert.ifError(err);
        assert.ok(result.errors === 0, 'There were errors while inserting records');
        clog.info(`Inserted ${result.inserted} records into [${rdbName}.${rdbTable}]`);
        connection.close();
        callback(null, result);
      });
  });
}

async.waterfall([
  setupDb,
  getSourceRecords,
  translateRecords,
  insertRecords
]);
