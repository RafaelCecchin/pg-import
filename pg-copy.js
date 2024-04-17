require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

function waitForEnter(callback) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      if (callback) callback();
  });
}

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

const dumpDir = path.join(__dirname, 'dump_files');
if (!fs.existsSync(dumpDir)) {
  fs.mkdirSync(dumpDir);
}

const dbSourceInfo = dbSources[argv['db-source']];
if (!dbSourceInfo) {
  console.error(`Banco de dados de origem "${argv['db-source']}" não reconhecido.`);
  process.exit(1);
}

const dbDestInfo = dbDestinations[argv['db-dest']];
if (!dbDestInfo) {
  console.error(`Banco de dados de destino "${argv['db-dest']}" não reconhecido.`);
  process.exit(1);
}

const clean = argv['clean'];
const onlyRestore = argv['only-restore'];
const onlyDump = argv['only-dump'];
const removeFiles = argv['rm'];

const pgDumpOptionsSchema = `pg_dump -U ${dbSourceInfo.user} -h ${dbSourceInfo.host} -p 5432 -E ${argv.encode} -x -O -s ${clean ? '-c -C' : ''} -t ${argv.tables.join(' -t ')} -Fp "${dbSourceInfo.name}" > ${path.join(dumpDir, 'schema')}`;
const pgDumpOptionsData = `pg_dump -U ${dbSourceInfo.user} -h ${dbSourceInfo.host} -p 5432 -E ${argv.encode} -x -O --rows-per-insert=${argv['rows-per-insert']} -Fp --column-inserts -a ${argv.tables ? `-t ${argv.tables.join(' -t ')}` : ''} ${argv.ignore ? `-T ${argv.ignore.join(' -T ')}` : ''} "${dbSourceInfo.name}" > ${path.join(dumpDir, 'data')}`;

if (!onlyRestore) {
  try {
    process.env.PGPASSWORD = dbSourceInfo.password;

    console.log('Executando pg_dump para esquema...');
    execSync(pgDumpOptionsSchema, { stdio: 'inherit', shell: 'cmd.exe' });
    console.log('Executando pg_dump para dados...');
    execSync(pgDumpOptionsData, { stdio: 'inherit', shell: 'cmd.exe' });

    console.log('Backup concluído com sucesso.');
  } catch (error) {
    console.error('Erro ao executar pg_dump:', error);
    process.exit(1);
  }
}

if (!onlyDump) {
  let pgRestoreSchema = [];
  if (clean) {
    // Se informar o --clean, ele apaga o banco de dados e cria novamente
    pgRestoreSchema = [
      `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "DROP DATABASE IF EXISTS \\"${dbDestInfo.name}\\""`,
      `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "CREATE DATABASE \\"${dbDestInfo.name}\\""`,
      `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "GRANT CONNECT ON DATABASE \\"${dbDestInfo.name}\\" TO ${dbDestInfo.user};"`,
      `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "GRANT USAGE ON SCHEMA public TO ${dbDestInfo.user};"`
    ];
  } else {
    // Se não informar o --clean, ele apaga apenas as tabelas informadas
    argv.tables.forEach(element => {
      pgRestoreSchema.push(`psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -1 -c "DROP TABLE IF EXISTS \\"${element}\\""`);
    });
  }
  pgRestoreSchema.push(`psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -1 -f ${path.join(dumpDir, 'schema')}`);
  const pgRestoreData = `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -1 -f ${path.join(dumpDir, 'data')}`;
    
  try {
    process.env.PGPASSWORD = dbDestInfo.password;
    
    console.log('\nPressione qualquer tecla para iniciar a restauração do esquema e dos dados...');

    waitForEnter(() => {
      console.log('Restaurando esquema no banco de destino...');
      pgRestoreSchema.forEach(cmd => {
          execSync(cmd, { stdio: 'inherit', shell: 'cmd.exe' });
      });

      console.log('Restaurando dados no banco de destino...');
      execSync(pgRestoreData, { stdio: 'inherit', shell: 'cmd.exe' });

      console.log('Backup e restauração concluídos com sucesso.');

      if (removeFiles) {
        fs.unlinkSync(path.join(dumpDir, 'schema'));
        fs.unlinkSync(path.join(dumpDir, 'data'));
      }

      process.stdin.setRawMode(false);
      process.stdin.pause();
    });
  } catch (error) {
    console.error('Erro ao executar psql:', error);
    process.exit(1);
  }
}