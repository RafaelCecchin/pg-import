const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { db } = require('./config');

const argv = yargs(hideBin(process.argv))
  .options({
    'db-source': {
      alias: 's',
      description: 'Source database name',
      choices: Object.keys(db['dbSources']),
      type: 'string',
      demandOption: true,
    },
    'db-dest': {
      alias: 'd',
      description: 'Target database name',
      choices: Object.keys(db['dbDestinations']),
      type: 'string',
      demandOption: true,
    },
    'tables': {
      alias: 't',
      description: 'Table names',
      type: 'array',
      demandOption: true,
    },
    'clean': {
      description: 'Clean target database before copying',
      type: 'boolean',
      default: false,
    },
    'encode': {
      description: 'Definir a codificação dos dados',
      type: 'string',
      default: 'LATIN1',
    },
    'ignore': {
      description: 'Define data encoding',
      type: 'array'
    },
    'rows-per-insert': {
      description: 'Number of lines per insert',
      type: 'string',
      default: '2000',
    },
    'only-restore': {
      description: 'Just restore, don\'t DUMP',
      type: 'boolean',
      default: false,
    },
    'only-dump': {
      description: 'Just DUMP, not restore',
      type: 'boolean',
      default: false,
    },
    'rm': {
      description: 'Remove DUMP files',
      type: 'boolean',
      default: false,
    }
  })
  .check((argv) => {
    if (argv['only-restore'] && argv['only-dump']) {
      throw new Error('The --only-restore and --only-dump options cannot be used simultaneously.');
    }

    if (argv['only-dump'] && argv['rm']) {
      throw new Error('The --only-dump and --rm options cannot be used simultaneously.');
    }

    return true;
  })
  .argv;

module.exports = argv;