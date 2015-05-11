Install rethink: http://www.rethinkdb.com/docs/install/ubuntu/

Install mdbtools `apt-get install mdbtools`

Install local packages `npm install`

## Development

Copy `server/config/production.sample.json` to `server/config/production.json` and fill in config values.

`gulp watch` in one terminal to watch and dist source files

`npm start` in another terminal to run the app

## ETL

`npm run etl` to rebuild the new Rethink database from the original Access database
