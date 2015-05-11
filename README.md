Install rethink: http://www.rethinkdb.com/docs/install/ubuntu/

Install mdbtools `apt-get install mdbtools`

Install local packages `npm install`

## Development

`rethinkdb` to start RethinkDB server

### ETL

Download the original database file from https://s3-us-west-2.amazonaws.com/tnris-misc/historical-aerials/Aerial_database_20150504.accdb and place in `data/`

`npm run etl` to rebuild the new Rethink database from the original Access database

### Web API and Admin Interface

Copy `server/config/production.sample.json` to `server/config/production.json` and fill in config values.

`gulp watch` in one terminal to watch and dist source files

`npm start` in another terminal to run the app

