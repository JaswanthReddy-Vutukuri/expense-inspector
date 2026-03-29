const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let db = null;

// DB_PATH lets docker-compose point the database to a named volume directory.
// Falls back to the original location for local development.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

async function getDb() {
  if (db) return db;

  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  return db;
}

module.exports = { getDb };
