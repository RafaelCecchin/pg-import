# PostgreSQL Copy

## Description
Node CLI script to transfer data between PostgreSQL databases easily.

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

Create a file called `pg-import.db.js` in the root of your project.

In this file there must be 2 objects: `dbSources` and `dbDestinations`.

Preferably, use the `.env` file to fill in the access credentials.

Below I present an example:

```javascript
module.exports = {
  'dbSources': {
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
  },
  'dbDestinations': {
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
  }
}
```

### Step 6: Make the transfers

Now that everything is configured, you can use bash to make transfers between databases.

```bash
node node_modules/@rafaelcecchin/pg-import/pg-import.js --db-source=producao --db-dest=producao --tables=rnc cargos defeitos_causas
```

The script above will make a copy of the tables (`--tables`) from the source database (`--db-source`) to the destination database (`--db-dest`).

You can also pass additional parameters:
- `--clean`: Clean the target database before copying
- `--encode`: Set the data encoding
- `--ignore`: Inform that they should be ignored during export
- `--rows-per-insert`: Number of rows per insert
- `--only-restore`: Just restore, without doing DUMP
- `--only-dump`: Only DUMP, without restoring
- `--rm`: Remove backup files

### Final considerations

Although this script facilitates data transfer between PostgreSQL databases, the process can be improved.
Collaborate with this small project, make a pull request.