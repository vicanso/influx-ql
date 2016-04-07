'use strict';
const assert = require('assert');
const QL = require('..');
const db = 'timtam';

describe('influxdb-ql', () => {
  const ql = new QL(db);
  it('create database', () => {
    assert.equal(ql.createDatabase, 'create database timtam');
  });

  it('create database not exists', () => {
    assert.equal(ql.createDatabaseNotExists, 'create database if not exists timtam');
  });

  it('show database', () => {
    assert.equal(QL.showDatabases, 'SHOW DATABASES');
  });

  it('show retention policies', () => {
    assert.equal(ql.showRetentionPolicies, 'SHOW RETENTION POLICIES ON "timtam"');
  });

  it('show tag keys', () => {
    assert.equal(QL.showTagKeys, 'SHOW TAG KEYS');
  });

});