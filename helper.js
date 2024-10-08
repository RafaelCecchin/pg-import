const fs = require('fs');
const path = require('path');

function createDumpFolder(importID) {
  const dumpDir = path.join(process.cwd(), 'dump_files');
  if (!fs.existsSync(dumpDir)) {
    fs.mkdirSync(dumpDir);
  }
  
  const dumpIDdir = path.join(process.cwd(), `dump_files/${importID}`);
  if (!fs.existsSync(dumpIDdir)) {
    fs.mkdirSync(dumpIDdir);
  }

  return dumpIDdir;
}

function isValidImport(importData) {

    if (!importData['source']) {
        console.log('Source database not defined!');
        return false;
    }
    
    if (!importData['destination']) {
        console.log('Destination database not defined!');
        return false;
    }

    if (!importData['encode']) {
        console.log('Encode not defined!');
        return false;
    }

    if (importData['only-restore'] && importData['only-dump']) {
        console.log('The "only-restore" and "only-dump" options cannot be used simultaneously.');
        return false;
    }

    if (importData['only-dump'] && importData['rm']) {
        console.log('The "only-dump" and "rm" options cannot be used simultaneously.');
        return false;
    }

    return true;
}

module.exports = { createDumpFolder, isValidImport };  