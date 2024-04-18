require('dotenv').config();
const fs = require('fs');
const path = require('path');
const dbConfFile = path.join(process.cwd(), 'pg-import.db.js');
const db = fs.existsSync(dbConfFile) ? require(dbConfFile) : require('./pg-import.db.js');

if (!db['dbSources'] || !db['dbDestinations']) {
  console.log(`
    Database configuration file not found or empty!
    Create a pg-import.db.js file in the root of your project and fill in the database information.
  `);
  process.exit(1);
}

const dumpDir = path.join(process.cwd(), 'dump_files');
if (!fs.existsSync(dumpDir)) {
  fs.mkdirSync(dumpDir);
}

module.exports = { db, dumpDir };