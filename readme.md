# PostgreSQL Copy

## Description
Node script to transfer data between PostgreSQL databases easily.

## How to use

### Step 1: Install PostgreSQL v12 or higher

This is necessary for the `--rows-per-insert` command from `pg_dump` to work.

### Step 2: Add the environment variables

Add the path to your PostgreSQL "bin" folder to the "Path" system environment variable.
Note: in my case, it is located in "`C:\Program Files\PostgreSQL\12\bin`".

### Step 3: Install Node.js (if you don't have it)

[Click here](https://nodejs.org/en) to access the Node.js page and download.

### Step 4: Install libraries

Run the command (only if you haven't started npm in your project yet):

```bash
npm init
```

Run the command below:

```bash
npm install @rafaelcecchin/pg-import
```

### Step 5: Configure databases

Create a file called `pg-import.config.js` in the root of your project.

Below I present an example:

```javascript
module.exports = {
  'db': {
    'erp-prod': {
      name: 'erp',
      host: process.env.PROD_ERP_HOST,
      user: process.env.PROD_ERP_USER,
      password: process.env.PROD_ERP_PASSWORD
    },
    'erp-dev': {
      name: 'erp',
      host: process.env.DEV_ERP_HOST,
      user: process.env.DEV_ERP_USER,
      password: process.env.DEV_ERP_PASSWORD
    }
  },
  'import': {
    'import1': {
      'source': 'erp-prod',
      'destination': 'erp-dev',
      'tables': [
        'rotas'
      ],
      'clean': true,
      'encode': 'LATIN1',
      'rows-per-insert': 5000,
      'template': 'template0',
      'lc-collate': 'C',
      'lc-ctype': 'C'
    },
    'import2': {
      'source': 'erp-prod',
      'destination': 'erp-dev',
      'tables': [
        'clientes'
      ],
      'clean': false,
      'encode': 'LATIN1',
      'rows-per-insert': 5000
    }
  }
}
```

Import args
- `source`: Source database
- `destination`: Destination database
- `tables`: Tables to transfer
- `clean`: Clean the target database before copying
  - `encode`: Set the database encoding
  - `template`: Set the database template
  - `lc-collate`: Set the database collate
  - `lc-ctype`: Set the database ctype
- `ignore`: Inform that they should be ignored during export
- `rows-per-insert`: Number of rows per insert
- `only-restore`: Just restore, without doing DUMP
- `only-dump`: Only DUMP, without restoring
- `rm`: Auto remove backup files

### Step 6: Make the transfers

Now that everything is configured, you can use bash to make transfers between databases.

```bash
node node_modules/@rafaelcecchin/pg-import/pg-import.js
```

### Final considerations

Although this script facilitates data transfer between PostgreSQL databases, the process can be improved.
Collaborate with this small project, make a pull request.