require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const dbSources = {
  'erp': {
    name: 'erp',
    host: process.env.ERP_HOST,
    user: process.env.ERP_USER,
    password: process.env.ERP_PASSWORD,
  },
  'producao': {
    name: 'producao',
    host: process.env.PRODUCAO_HOST,
    user: process.env.PRODUCAO_USER,
    password: process.env.PRODUCAO_PASSWORD,
  },
};

const dbDestinations = {
  'dbtest': {
    name: 'dbtest',
    host: process.env.DBTEST_HOST,
    user: process.env.DBTEST_USER,
    password: process.env.DBTEST_PASSWORD,
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

const pgDumpOptionsSchema = `pg_dump -U ${dbSourceInfo.user} -h ${dbSourceInfo.host} -p 5432 -s -c -t ${argv.tables.join(' -t ')} -Fp ${argv['db-source']} > ${path.join(dumpDir, 'schema.sql')}`;
const pgDumpOptionsData = `pg_dump -U ${dbSourceInfo.user} -h ${dbSourceInfo.host} -p 5432 --rows-per-insert=2000 -Fp --column-inserts -a -t ${argv.tables.join(' -t ')} ${argv['db-source']} > ${path.join(dumpDir, 'data.sql')}`;

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

const pgRestoreSchema = `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d ${argv['db-dest']} -1 -f ${path.join(dumpDir, 'schema.sql')}`;
const pgRestoreData = `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d ${argv['db-dest']} -1 -f ${path.join(dumpDir, 'data.sql')}`;

try {
    process.env.PGPASSWORD = dbDestInfo.password;

    console.log('Restaurando esquema no banco de destino...');
    execSync(pgRestoreSchema, { stdio: 'inherit', shell: 'cmd.exe' });
    console.log('Restaurando dados no banco de destino...');
    execSync(pgRestoreData, { stdio: 'inherit', shell: 'cmd.exe' });
    
    console.log('Backup e restauração concluídos com sucesso.');
} catch (error) {
    console.error('Erro ao executar psql:', error);
    process.exit(1);
}

fs.unlinkSync(path.join(dumpDir, 'schema.sql'));
fs.unlinkSync(path.join(dumpDir, 'data.sql'));