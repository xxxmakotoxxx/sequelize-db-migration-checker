#!/usr/bin/env node
'use strict';

const fs = require("fs");
const fsPromises = require("fs").promises;
const mysql = require('mysql2');
const util = require('util');
const path = require('path');
const { exit } = require("process");

var argv = require('yargs')
  .usage('Usage: migration-checker -h <host> -d <database> -u <user> -x <password> -p <port> -m <migration file dir>')
  .demand(['d', 'u', 'x', 'm'])
  .alias('h', 'host')
  .alias('d', 'database')
  .alias('u', 'user')
  .alias('x', 'pass')
  .alias('p', 'port')
  .alias('m', 'dir')
  .describe('h', 'IP/Hostname for the database.')
  .describe('d', 'Database name.')
  .describe('u', 'Username for database.')
  .describe('x', 'Password for database.')
  .describe('p', 'Port number for database.')
  .describe('m', 'Path to migration file.')
  .argv;

let config = {};
config.host = argv.h || 'localhost';
config.port = argv.p || 3306;
config.user = argv.u;
config.password = argv.x;
config.database = argv.d;
config.dir = argv.m;

(async () => {
  // DBに登録されてるmigrationファイル名取得
  const migration_files_by_db = await get_migration_file_name_by_db(config);
  if (migration_files_by_db.length == 0) {
    console.log("SequelizeMeta has not records.");
    return;
  }
  console.log("migration_files_by_db.length:", migration_files_by_db.length);
  
  // ローカルのmigrationファイル名取得
  const migration_files_by_dir = await get_migration_file_name_by_dir(config);
  if (migration_files_by_dir.length == 0) {
    console.log("dir has not migration files.");
    return;
  }
  console.log("migration_files_by_dir.length:", migration_files_by_dir.length);

  // DBに登録されていてローカルにないファイル
  const only_db_files = migration_files_by_db.filter(db_file => {
    return migration_files_by_dir.indexOf(db_file) == -1
  });
  if (only_db_files.length > 0) {
    console.log("以下のファイルはローカルにありません");
    for (const file of only_db_files) {
      console.log(file);
    }
  } else {
    console.log("DBに登録されているファイルはすべてローカルに存在します");
  }

  // ローカルあってDBに登録されていないファイル
  const only_dir_files = migration_files_by_dir.filter(dir_file => {
    return migration_files_by_db.indexOf(dir_file) == -1
  });
  if (only_dir_files.length > 0) {
    console.log("以下のファイルはDBに登録されていません");
    for (const file of only_dir_files) {
      console.log(file);
    }
  } else {
    console.log("ローカルのファイルは全てDBに登録されています");
  }
})();

async function get_migration_file_name_by_db(config) {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host : config.host,
    user : config.user,
    password : config.password,
    port : config.port,
    database: config.database
  });
  
  let names = [];
  pool.query = util.promisify(pool.query);
  try {
    const rows = await pool.query('SELECT * from SequelizeMeta;');
    pool.end();
    for (const row of rows) {
      names.push(row.name);
    }
  } catch (err) {
    throw new Error(err);
  }
  return names;
}

// ローカルのmigrationファイル名取得
async function get_migration_file_name_by_dir(config) {
  let file_list = [];
  try {
    let files = await fsPromises.readdir(config.dir);
    file_list = files.filter(function(file) {
      return fs.statSync(config.dir + '/' + file).isFile() && /.*\.js$/.test(file);
    });
  } catch (err) {
    throw new Error(err);
  }
  return file_list;
}
