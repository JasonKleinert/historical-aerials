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

const accessDb = mdb('Aerial_database.accdb');
const accessTable = 'Aerial_Info';
const rdbName = 'AerialImagery';
const rdbTable = 'AerialInfo';

//TODO: Check badCounties.csv with Joey
//TODO: Should I fix AcquiringAgency inconsitencies? Ask Joey

const countyFips = () => {
  const contents = fs.readFileSync('./st48_tx_cou.txt', 'utf-8');
  const rows = csv.parseRows(contents);
  return rows.map(function (row) {
    return {
      FIPS: tryparse.int(row[1] + row[2]),
      Name: row[3].replace(' County', '')
    };
  });
}();

const badCountyNameMap = () => {
  const contents = fs.readFileSync('./badCounties.csv', 'utf-8');
  return csv.parse(contents);
}();


async.waterfall([
  setupDb,
  getSourceRecords,
  translateRecords,
  insertRecords
]);


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


function findCounty(name, dbNo) {
  const foundVal = R.find((cf) => {
    return name.toUpperCase() === cf.Name.toUpperCase();
  }, countyFips);

  if (foundVal) { 
    return foundVal;
  }

  //else
  clog.warn(`Unable to find county "${name}" (DB_No ${dbNo}). Using badCountyNameMap.`);
  const foundGoodNameRec = R.find((goodBad) => {
    return goodBad.BadName === name;
  }, badCountyNameMap);

  if (!foundGoodNameRec) {
    clog.error(`Still unable to find "${name}". Aborting.`);
    throw new Error(`Unable to find county "${name}"`);
  }

  return findCounty(foundGoodNameRec.GoodName, dbNo);
}


function translateRecords(rows, callback) {
  const newRows = rows.map((row) => {
    return {
      AcquiringAgency: row.Aquire_Agency.toUpperCase(),
      // CanisterNo: row.Canister_No, //NOT NEEDED - always blank
      County: findCounty(row.County, row.DB_No), 
      Coverage: row.Coverage.toUpperCase() === 'Y',
      OrigDBNumber: tryparse.int(row.DB_No), //original Access PK
      Date: parseDate(row.Date),
      // FirstFrame: tryparse.int(row.First_frame), //NOT NEEDED - unused generally
      Format: tryparse.int(row.Format),
      IndexType: row.Index_type,
      LocationCode: row.Location_code, //internal location index/code
      Mission: row.MSN,
      Medium: row.Medium.toUpperCase(),
      NumFrames: tryparse.int(row.No_of_frames),
      // IsPositive: row.Pos_Neg === "POS", //NOT NEEDED - not relevant
      PrintType: row.Print_type.toUpperCase(), //B&W, CIR (color infrared), COL (color)
      RSDIS: tryparse.int(row.RSDIS), //Old index system
      Remarks: row.Remarks.trim(),
      Scale: tryparse.int(row.Scale),
      IsPublic: row.Security_status.toUpperCase() === 'PUBLIC'
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

