const { execSync } = require('child_process');
const { configFile } = require('./config');
const { waitForKey, createDumpFolder, isValidImport } = require('./helper');
const fs = require('fs');
const path = require('path');

(async () => {
  for (const el of configFile['import']) {
    
    const importID = el['id'];

    console.log(`\n`);
    console.log(`- - - - - - - - - - - - - - - -`);
    console.log(`      IMPORT ${importID}       `);
    console.log(`- - - - - - - - - - - - - - - -`);
    
    if (!isValidImport(el)) {
      continue;
    }

    const dbSourceInfo = configFile['db'][el['source']];
    const dbDestInfo = configFile['db'][el['destination']];
    const tables = el['tables'];

    const clean = el['clean'];
    const encode = el['encode'];
    const ignore = el['ignore'];
    const rowsPerInsert = el['rows-per-insert'];
    const onlyRestore = el['only-restore'];
    const onlyDump = el['only-dump'];
    const removeFiles = el['rm'];

    // Create dump folder
    const dumpFolder = createDumpFolder(importID);
    const schemaFileDir = path.join(dumpFolder, 'schema');
    const dataFileDir = path.join(dumpFolder, 'data');

    // Set PSQL ENCODING
    process.env.PGCLIENTENCODING = encode;

    // DUMP
    if (!onlyRestore) {
      const pgDumpOptionsSchema = `pg_dump -U ${dbSourceInfo.user} -h ${dbSourceInfo.host} -p 5432 -E ${encode} -x -O -s ${clean ? '-c -C' : ''} -t ${tables.join(' -t ')} -Fp "${dbSourceInfo.name}" > ${schemaFileDir}`;
      const pgDumpOptionsData = `pg_dump -U ${dbSourceInfo.user} -h ${dbSourceInfo.host} -p 5432 -E ${encode} -x -O --rows-per-insert=${rowsPerInsert} -Fp --column-inserts -a -t ${tables.join(' -t ')} ${ignore ? `-T ${ignore.join(' -T ')}` : ''} "${dbSourceInfo.name}" > ${dataFileDir}`;

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
          `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "CREATE DATABASE \\"${dbDestInfo.name}\\" WITH TEMPLATE = template0 ENCODING = '${encode}' LC_COLLATE = 'C' LC_CTYPE = 'C'"`,
          `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "GRANT CONNECT ON DATABASE \\"${dbDestInfo.name}\\" TO ${dbDestInfo.user};"`,
          `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "GRANT USAGE ON SCHEMA public TO ${dbDestInfo.user};"`
        ];
      } else {
        tables.forEach(element => {
          pgRestoreSchema.push(`psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -1 -c "DROP TABLE IF EXISTS \\"${element}\\""`);
        });
      }
      
      pgRestoreSchema.push(`psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -1 -f ${schemaFileDir}`);
      const pgRestoreData = `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -1 -f ${dataFileDir}`;

      try {
        process.env.PGPASSWORD = dbDestInfo.password;
        
        console.log('\nPress [ENTER] to start schema and data restore...');
        await waitForKey();

        console.log('Restoring schema in destination db...');
        for (const cmd of pgRestoreSchema) {
            execSync(cmd, { stdio: 'inherit', shell: 'cmd.exe' });
        }

        console.log('Restoring data to destination db...');
        execSync(pgRestoreData, { stdio: 'inherit', shell: 'cmd.exe' });

        console.log('Backup and restore completed successfully.');

        if (removeFiles) {
          fs.unlinkSync(schemaFileDir);
          fs.unlinkSync(dataFileDir);
        }

        process.stdin.setRawMode(false);
        process.stdin.pause();
      } catch (error) {
        console.error('Error when running psql:', error);
        process.exit(1);
      }
    }
  }
})();