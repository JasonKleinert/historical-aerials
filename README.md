Install rethink: http://www.rethinkdb.com/docs/install/ubuntu/

Install packages `npm install`

## Development

### Web API and Admin Interface

Copy `server/config/production.sample.json` to `server/config/production.json` and fill in config values.

**Important:** If you are going to make production deploys, ensure that `config/production.json`
is properly filled out, paying special attention to either use or resave the `adminPassword` in
our password repository.

You can copy an existing dump of the database from our backup bucket on S3. Run `rethinkdb restore backupfile.tar.gz` to restore the dump to your local rethinkdb server.

`gulp dev` in one terminal to watch and dist source files

`npm start` in another terminal to run the app

### ETL

Hopefully this should not be done ever again, but here are the steps.

Download the original database file from https://s3-us-west-2.amazonaws.com/tnris-misc/historical-aerials/Aerial_database_20150504.accdb and place in `data/`

`apt-get install mdbtools` to install mdbtools, which is required for reading the Access database

`npm run etl` to rebuild the new Rethink database from the original Access database
