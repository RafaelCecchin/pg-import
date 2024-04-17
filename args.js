const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { dbSources, dbDestinations } = require('./config');

const argv = yargs(hideBin(process.argv))
  .options({
    'db-source': {
      alias: 's',
      description: 'Nome do banco de dados de origem',
      choices: Object.keys(dbSources),
      type: 'string',
      demandOption: true,
    },
    'db-dest': {
      alias: 'd',
      description: 'Nome do banco de dados de destino',
      choices: Object.keys(dbDestinations),
      type: 'string',
      demandOption: true,
    },
    'tables': {
      alias: 't',
      description: 'Nomes das tabelas',
      type: 'array',
      demandOption: true,
    },
    'clean': {
      description: 'Limpar o banco de dados de destino antes da cópia',
      type: 'boolean',
      default: false,
    },
    'encode': {
      description: 'Definir a codificação dos dados',
      type: 'string',
      default: 'LATIN1',
    },
    'ignore': {
      description: 'Ignorar dados de tabelas',
      type: 'array'
    },
    'rows-per-insert': {
      description: 'Quantidade de linhas por insert',
      type: 'string',
      default: '2000',
    },
    'only-restore': {
      description: 'Apenas restaura, não faz o DUMP.',
      type: 'boolean',
      default: false,
    },
    'only-dump': {
      description: 'Apenas faz o DUMP, não restaura.',
      type: 'boolean',
      default: false,
    },
    'rm': {
      description: 'Remove os arquivos de DUMP.',
      type: 'boolean',
      default: false,
    }
  })
  .check((argv) => {
    if (argv['only-restore'] && argv['only-dump']) {
      throw new Error('As opções --only-restore e --only-dump não podem ser usadas simultaneamente.');
    }

    if (argv['only-dump'] && argv['rm']) {
      throw new Error('As opções --only-dump e --rm não podem ser usadas simultaneamente.');
    }

    return true;
  })
  .argv;

module.exports = argv;