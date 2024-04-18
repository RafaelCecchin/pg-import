const fs = require('fs');
const path = require('path');
const argv = require('./args');
const { execSync } = require('child_process');
const { db, dumpDir } = require('./config');
const { waitForEnter } = require('./helper');

const dbSourceInfo = db['dbSources'][argv['db-source']];
const dbDestInfo = db['dbDestinations'][argv['db-dest']];
const clean = argv['clean'];
const onlyRestore = argv['only-restore'];
const onlyDump = argv['only-dump'];
const removeFiles = argv['rm'];

// DUMP
if (!onlyRestore) {
  const pgDumpOptionsSchema = `pg_dump -U ${dbSourceInfo.user} -h ${dbSourceInfo.host} -p 5432 -E ${argv.encode} -x -O -s ${clean ? '-c -C' : ''} -t ${argv.tables.join(' -t ')} -Fp "${dbSourceInfo.name}" > ${path.join(dumpDir, 'schema')}`;
  const pgDumpOptionsData = `pg_dump -U ${dbSourceInfo.user} -h ${dbSourceInfo.host} -p 5432 -E ${argv.encode} -x -O --rows-per-insert=${argv['rows-per-insert']} -Fp --column-inserts -a ${argv.tables ? `-t ${argv.tables.join(' -t ')}` : ''} ${argv.ignore ? `-T ${argv.ignore.join(' -T ')}` : ''} "${dbSourceInfo.name}" > ${path.join(dumpDir, 'data')}`;

  try {
    process.env.PGPASSWORD = dbSourceInfo.password;

    console.log('Running pg_dump for schema...');
    execSync(pgDumpOptionsSchema, { stdio: 'inherit', shell: 'cmd.exe' });
    console.log('Running pg_dump for data...');
    execSync(pgDumpOptionsData, { stdio: 'inherit', shell: 'cmd.exe' });

    console.log('Backup completed successfully.');
  } catch (error) {
    console.error('Error when running pg_dump:', error);
    process.exit(1);
  }
}

// RESTORE
if (!onlyDump) {

  let pgRestoreSchema = [];

  if (clean) {
    pgRestoreSchema = [
      `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "DROP DATABASE IF EXISTS \\"${dbDestInfo.name}\\""`,
      `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "CREATE DATABASE \\"${dbDestInfo.name}\\""`,
      `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "GRANT CONNECT ON DATABASE \\"${dbDestInfo.name}\\" TO ${dbDestInfo.user};"`,
      `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "GRANT USAGE ON SCHEMA public TO ${dbDestInfo.user};"`
    ];
  } else {
    argv.tables.forEach(element => {
      pgRestoreSchema.push(`psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -1 -c "DROP TABLE IF EXISTS \\"${element}\\""`);
    });
  }
  
  pgRestoreSchema.push(`psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -1 -f ${path.join(dumpDir, 'schema')}`);
  const pgRestoreData = `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -1 -f ${path.join(dumpDir, 'data')}`;

  try {
    process.env.PGPASSWORD = dbDestInfo.password;
    
    console.log('\nPress any key to start schema and data restore...');

    waitForEnter(() => {
      console.log('Restoring schema in destination db...');
      pgRestoreSchema.forEach(cmd => {
          execSync(cmd, { stdio: 'inherit', shell: 'cmd.exe' });
      });

      console.log('Restoring data to destination db...');
      execSync(pgRestoreData, { stdio: 'inherit', shell: 'cmd.exe' });

      console.log('Backup and restore completed successfully.');

      if (removeFiles) {
        fs.unlinkSync(path.join(dumpDir, 'schema'));
        fs.unlinkSync(path.join(dumpDir, 'data'));
      }

      process.stdin.setRawMode(false);
      process.stdin.pause();
    });
  } catch (error) {
    console.error('Error when running psql:', error);
    process.exit(1);
  }
}