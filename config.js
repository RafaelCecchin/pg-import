require('dotenv').config();
const fs = require('fs');
const path = require('path');
const dbConfFile = path.join(process.cwd(), 'pg-import.db.js');
const db = fs.existsSync(dbConfFile) ? require(dbConfFile) : require('./pg-import.db.js');

if (!db['dbSources'] || !db['dbDestinations']) {
  console.log(`
    Arquivo de configuração de banco de dados não localizado ou vazio!
    Crie um arquivo pg-import.db.js na raiz do seu projeto com o seguinte formato:

    module.exports = {
      'dbSources': {
        'xxx': {
          name: process.env.PROD_ERP_NAME,
          host: process.env.PROD_ERP_HOST,
          user: process.env.PROD_ERP_USER,
          password: process.env.PROD_ERP_PASSWORD
        },
        'yyy': {
          name: process.env.DEV_ERP_NAME,
          host: process.env.DEV_ERP_HOST,
          user: process.env.DEV_ERP_USER,
          password: process.env.DEV_ERP_PASSWORD
        }
      },
      'dbDestinations': {
        'xxx': {
          name: process.env.PROD_ERP_NAME,
          host: process.env.PROD_ERP_HOST,
          user: process.env.PROD_ERP_USER,
          password: process.env.PROD_ERP_PASSWORD
        },
        'yyy': {
          name: process.env.DEV_ERP_NAME,
          host: process.env.DEV_ERP_HOST,
          user: process.env.DEV_ERP_USER,
          password: process.env.DEV_ERP_PASSWORD
        }
      }
    }`);
  process.exit(1);
}

const dumpDir = path.join(__dirname, 'dump_files');

module.exports = { db, dumpDir };