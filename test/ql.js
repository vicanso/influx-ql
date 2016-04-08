'use strict';
const assert = require('assert');
const QL = require('..');

describe('influxdb-ql', () => {

  it('list series', () => {
    assert.equal(QL.listSeries(), 'select * from /.*/ limit 1');
  });

  it('select *', () => {
    const ql = new QL();
    ql.series = 'http';
    assert.equal(ql.toSelect(), 'select * from "http"');

    ql.series = 'my series "name"';
    assert.equal(ql.toSelect(), 'select * from "my series \\"name\\""');
  });

  it('select field', () => {
    const ql = new QL();
    ql.series = 'http';
    ql.addField('status');
    assert.equal(ql.toSelect(), 'select status from "http"');

    ql.removeField('status');
    assert.equal(ql.toSelect(), 'select * from "http"');
  });

  it('select multi fields', () => {
    const ql = new QL();
    ql.series = 'http';
    ql.addField('status', 'code');
    assert.equal(ql.toSelect(), 'select code,status from "http"');

    ql.removeField('status', 'code');
    assert.equal(ql.toSelect(), 'select * from "http"');
  });

  it('set start and end time', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.start = '2016-03-01 23:32:01.232';
    ql.end = '2016-03-02';
    assert.equal(ql.toSelect(), 'select * from "http" where time < \'2016-03-02\' and time > \'2016-03-01 23:32:01.232\'');

    // 3 hours ago
    ql.end = '-3h';
    assert.equal(ql.toSelect(), 'select * from "http" where time < now() - 3h and time > \'2016-03-01 23:32:01.232\'');

    // Absolute time
    ql.end = '1388534400s';
    assert.equal(ql.toSelect(), 'select * from "http" where time < 1388534400s and time > \'2016-03-01 23:32:01.232\'');
  });

  it('set limit', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.limit = 10;

    assert.equal(ql.toSelect(), 'select * from "http" limit 10');
  });

  it('add conditions', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.addCondition('code = 500', 'spdy = 1');
    assert.equal(ql.toSelect(), 'select * from "http" where code = 500 and spdy = 1');

    ql.removeCondition('code = 500');
    ql.condition('code', 404);
    assert.equal(ql.toSelect(), 'select * from "http" where code = 404 and spdy = 1');
  });

  it('delete ql', () => {

  });



// select value from response_times
// where time > '2013-08-12 23:32:01.232' and time < '2013-08-13';

  // it('create database', () => {
  //   assert.equal(QL.createDatabase(db), 'create database timtam');
  // });

  // it('create database not exists', () => {
  //   assert.equal(QL.createDatabaseNotExists(db), 'create database if not exists timtam');
  // });

  // it('show database', () => {
  //   assert.equal(QL.showDatabases(), 'SHOW DATABASES');
  // });

  // it('show retention policies', () => {
  //   assert.equal(QL.showRetentionPolicies(db), 'SHOW RETENTION POLICIES ON "timtam"');
  // });

  // it('show tag keys', () => {
  //   assert.equal(QL.showTagKeys, 'SHOW TAG KEYS');
  // });

});



// select * from "series with special characters!"

// select * from "series with \"double quotes\""
