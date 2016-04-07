'use strict';
const internal = require('./internal');
class QL {
  constructor(db) {
    const data = internal(this);
    data.db = db;
  }

  get createDatabase() {
    return `create database ${internal(this).db}`;
  }

  get createDatabaseNotExists() {
    return `create database if not exists ${internal(this).db}`;
  }

  get showRetentionPolicies() {
    return `SHOW RETENTION POLICIES ON "${internal(this).db}"`;
  }

  static get showDatabases() {
    return 'SHOW DATABASES';
  }

  static get showTagKeys() {
    return 'SHOW TAG KEYS';
  }
}

module.exports = QL;
