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

Access the project folder and run the command below:

```bash
npm install
```

### Step 5: Configure databases

Edit the `dbSources` and `dbDestinations` objects in the `config.js` file.
Preferably, use the `.env` file to fill in the access credentials.

### Step 6: Make the transfers

Now that everything is configured, you can use bash to make transfers between databases.

```bash
node pg-import.js --db-source=producao --db-dest=producao --tables=rnc cargos defeitos_causas
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