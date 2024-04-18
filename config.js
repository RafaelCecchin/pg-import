require('dotenv').config();
const fs = require('fs');
const path = require('path');
const projectConfFile = path.join(process.cwd(), 'pg-import.config.js');
const configFile = fs.existsSync(projectConfFile) ? require(projectConfFile) : null;

if (!configFile) {
  console.log(`Configuration file not found!`);
  process.exit(1);
}

if (!configFile['import']) {
  console.log(`No imports defined!`);
  process.exit(1);
}

module.exports = { configFile };