// Imagery records with dates prior to 1950 were incorrectly loaded as being
// in the 2000s (because the source database only had 2-digit years)
// This migration corrects that

var rethink = require('rethinkdb');
var assert = require('assert');
var moment = require('moment');

var config = require('../config');
var recordsTable = rethink.table('ImageryRecords'); 

var connectDb = function (callback) {
  rethink.connect({
    host: config.db_host,
    port: config.db_port,
    db: config.db_name
  }, function (err, connection) {
    assert.ifError(err);
    callback(err, connection);
  });
};

exports.up = function(next) {
  var dateRow = rethink.row('Date');
  var dateFilter = dateRow.ne(null)
    .and(dateRow.year().ge(2020));

  var fixYear = function (record) {
    var date = record('Date');
    console.log(date);
    var d = moment(date);
    if (d.isValid()) {
      console.log('here');
      d.subtract(100, 'years');
      return {'Date': d.toDate()};
    }

    return {};
  };

  connectDb(function (err, conn) {
    assert.ifError(err);

    recordsTable
      .filter(dateFilter)
      .update({
        'Date': rethink.time(dateRow.year().sub(100), dateRow.month(), dateRow.day(),
          dateRow.hours(), dateRow.minutes(), dateRow.seconds(), 'Z')
      })
      .run(conn, next);
    //select records with Date year >= to 2020
    //change year to be in 19 whatever
  });
};

exports.down = function(/*next*/) {
  throw new Error('Not implemented');
};
