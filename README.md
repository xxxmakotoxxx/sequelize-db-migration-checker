# sequelize-db-migration-checker
Check the difference between Sequelize migration file and DB registered files.

## Install

```
npm install -g sequelize-db-migration-checker
```

## Prerequisites

You will need to install the correct dialect binding globally before using sequelize-db-migration-checker.

Example for MySQL

```
npm install -g mysql2
```

## Usage

```
[node] migration-checker -h <host> -d <database> -u <user> -x <password> -p <port> -m <migration file dir>

Options:
  -h, --host        IP/Hostname for the database.   [default:localhost]
  -d, --database    Database name.                  [required]
  -u, --user        Username for database.          [required]
  -x, --pass        Password for database.          [required]
  -p, --port        Port number for database.
  -m, --dir         Path to migration dir.          [required]
```

## Example

```
migration-checker -h localhost -d migration_database -u username -x password -m '/path/to/migrations'
```
