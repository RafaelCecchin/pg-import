const { execSync } = require('child_process');
const { configFile } = require('./config');
const { createDumpFolder, isValidImport } = require('./helper');
const fs = require('fs');
const path = require('path');

(async () => {
  for (const [key, value] of Object.entries(configFile['import'])) {

    const importID = key;
    const el = value;

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

    const create_db = el['create-db'];
      const encode = el['encode'];
      const template = el['template'];
      const lc_collate = el['lc-collate'];
      const lc_ctype = el['lc-ctype'];

    const ignore = el['ignore'];
    const rowsPerInsert = el['rows-per-insert'];

    const onlyRestore = el['only-restore'];
    const onlyDump = el['only-dump'];

    const removeFiles = el['rm'];

    const beforeImportSchemaScripts = el['before-schema'] ?? [];
    const afterImportSchemaScripts = el['after-schema'] ?? [];

    const beforeImportDataScripts = el['before-data'] ?? [];
    const afterImportDataScripts = el['after-data'] ?? [];

    // Create dump folder
    const dumpFolder = createDumpFolder(importID);
    const schemaFileDir = path.join(dumpFolder, 'schema');
    const dataFileDir = path.join(dumpFolder, 'data');

    // Set PSQL ENCODING
    process.env.PGCLIENTENCODING = encode;

    // DUMP
    if (!onlyRestore) {
      const pgDumpOptionsSchema = `pg_dump -U ${dbSourceInfo.user} -h ${dbSourceInfo.host} -p ${dbSourceInfo.port ?? 5432} -E ${encode} -x -O -s -v --no-comments -c --if-exists -t ${tables.join(' -t ')} -Fc "${dbSourceInfo.name}" > ${schemaFileDir}`;
      const pgDumpOptionsData = `pg_dump -U ${dbSourceInfo.user} -h ${dbSourceInfo.host} -p ${dbSourceInfo.port ?? 5432} -E ${encode} -x -O -v --on-conflict-do-nothing --no-comments --rows-per-insert=${rowsPerInsert} -Fc --column-inserts -a -t ${tables.join(' -t ')} ${ignore ? `-T ${ignore.join(' -T ')}` : ''} "${dbSourceInfo.name}" > ${dataFileDir}`;

      try {
        process.env.PGPASSWORD = dbSourceInfo.pass;
        
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
      const pgRestoreSchema = `pg_restore -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p ${dbDestInfo.port ?? 5432} -c --if-exists -x -O -v -Fc -d \"${dbDestInfo.name}\" ${schemaFileDir}`;
      const pgRestoreData = `pg_restore -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p ${dbDestInfo.port ?? 5432} -x -O -v -Fc -d \"${dbDestInfo.name}\" ${dataFileDir}`;

      try {
        process.env.PGPASSWORD = dbDestInfo.pass;
        
        if (create_db) {
          console.log('Drop and create destination db...');
          pgCreateDB = [
            `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "DROP DATABASE IF EXISTS \\"${dbDestInfo.name}\\""`,
            `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "CREATE DATABASE \\"${dbDestInfo.name}\\" WITH ENCODING = '${encode}' ${template ? `TEMPLATE = '${template}'` : ''} ${lc_collate ? `LC_COLLATE = '${lc_collate}'` : ''} ${lc_ctype ? `LC_CTYPE = '${lc_ctype}'` : ''}"`,
            `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "GRANT CONNECT ON DATABASE \\"${dbDestInfo.name}\\" TO ${dbDestInfo.user};"`,
            `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -c "GRANT USAGE ON SCHEMA public TO ${dbDestInfo.user};"`
          ];

          for (const cmd of pgCreateDB) {
            execSync(cmd, { stdio: 'inherit', shell: 'cmd.exe' });
          }
        }

        if (beforeImportSchemaScripts.length) {
          console.log('Scripts to run before schema import...');
          for (const script of beforeImportSchemaScripts) {
            cmd = `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -c "${script}"`;
            execSync(cmd, { stdio: 'inherit', shell: 'cmd.exe' });
          }
        }

        console.log('Restoring schema in destination db...');
        execSync(pgRestoreSchema, { stdio: 'inherit', shell: 'cmd.exe' });

        if (afterImportSchemaScripts.length) {
          console.log('Scripts to run after schema import...');
          for (const script of afterImportSchemaScripts) {
            cmd = `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -c "${script}"`;
            execSync(cmd, { stdio: 'inherit', shell: 'cmd.exe' });
          }
        }

        if (beforeImportDataScripts.length) {
          console.log('Scripts to run before data import...');
          for (const script of beforeImportDataScripts) {
            cmd = `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -c "${script}"`;
            execSync(cmd, { stdio: 'inherit', shell: 'cmd.exe' });
          }
        }

        console.log('Restoring data to destination db...');
        execSync(pgRestoreData, { stdio: 'inherit', shell: 'cmd.exe' });
        
        if (afterImportDataScripts.length) {
          console.log('Scripts to run after data import...');
          for (const script of afterImportDataScripts) {
            cmd = `psql -U ${dbDestInfo.user} -h ${dbDestInfo.host} -p 5432 -d \"${dbDestInfo.name}\" -c "${script}"`;
            execSync(cmd, { stdio: 'inherit', shell: 'cmd.exe' });
          }
        }

        console.log('Backup and restore completed successfully.');

        if (removeFiles) {
          fs.unlinkSync(schemaFileDir);
          fs.unlinkSync(dataFileDir);
        }

      } catch (error) {
        console.error('Error when running psql:', error);
        process.exit(1);
      }
    }
  }
})();