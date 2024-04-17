require('dotenv').config();
const fs = require('fs');
const path = require('path');

const dbSources = {
  'erp': {
    name: 'erp',
    host: process.env.PROD_ERP_HOST,
    user: process.env.PROD_ERP_USER,
    password: process.env.PROD_ERP_PASSWORD
  },
  'producao': {
    name: 'Sistema Producao',
    host: process.env.PROD_PRODUCAO_HOST,
    user: process.env.PROD_PRODUCAO_USER,
    password: process.env.PROD_PRODUCAO_PASSWORD
  },
};

const dbDestinations = {
  'erp': {
    name: 'erp',
    host: process.env.DEV_ERP_HOST,
    user: process.env.DEV_ERP_USER,
    password: process.env.DEV_ERP_PASSWORD
  },
  'producao': {
    name: 'Sistema Producao',
    host: process.env.DEV_PRODUCAO_HOST,
    user: process.env.DEV_PRODUCAO_USER,
    password: process.env.DEV_PRODUCAO_PASSWORD
  }
};

const dumpDir = path.join(__dirname, 'dump_files');

module.exports = { dbSources, dbDestinations, dumpDir };