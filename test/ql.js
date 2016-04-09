'use strict';
const assert = require('assert');
const QL = require('..');

describe('influxdb-ql', () => {
  it('getter setter', () => {
    const ql = new QL();
    const attrList = [
      'series',
      'start',
      'end',
      'limit',
      'slimit',
      'fill',
      'into',
      'order',
      'offset'
    ];
    attrList.forEach(attr => {
      const v = 1;
      ql[attr] = v;
      assert.equal(ql[attr], v);
    });
  });

  it('list series', () => {
    assert.equal(QL.listSeries(), 'select * from /.*/ limit 1');
  });

  it('select *', () => {
    const ql = new QL();
    ql.series = 'http';
    assert.equal(ql.toSelect(), 'select * from http');
  });

  it('select field', () => {
    const ql = new QL();
    ql.series = 'http';
    ql.addField('status');
    assert.equal(ql.toSelect(), 'select status from http');

    ql.removeField('status');
    assert.equal(ql.toSelect(), 'select * from http');

    ql.addField('ajax status');
    assert.equal(ql.toSelect(), 'select "ajax status" from http');
  });

  it('select multi fields', () => {
    const ql = new QL();
    ql.series = 'http';
    ql.addField('status', 'code');
    assert.equal(ql.toSelect(), 'select code,status from http');

    ql.removeField('status', 'code');
    assert.equal(ql.toSelect(), 'select * from http');
  });

  it('set start and end time', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.start = '2016-03-01 23:32:01.232';
    ql.end = '2016-03-02';
    assert.equal(ql.toSelect(), 'select * from http where time <= \'2016-03-02\' and time >= \'2016-03-01 23:32:01.232\'');

    // 3 hours ago
    ql.end = '-3h';
    assert.equal(ql.toSelect(), 'select * from http where time <= now() - 3h and time >= \'2016-03-01 23:32:01.232\'');

    // Absolute time
    ql.end = '1388534400s';
    assert.equal(ql.toSelect(), 'select * from http where time <= 1388534400s and time >= \'2016-03-01 23:32:01.232\'');
  });

  it('set limit', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.limit = 10;

    assert.equal(ql.toSelect(), 'select * from http limit 10');
  });

  it('set slimit', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.addGroup('*');
    ql.slimit = 10;

    assert.equal(ql.toSelect(), 'select * from http group by * slimit 10');

    ql.limit = 5;
    assert.equal(ql.toSelect(), 'select * from http group by * limit 5 slimit 10');
  });

  it('add conditions', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.addCondition('code = 500', 'spdy = 1');
    assert.equal(ql.toSelect(), 'select * from http where code = 500 and spdy = 1');

    ql.removeCondition('code = 500');
    ql.condition('code', 404);
    assert.equal(ql.toSelect(), 'select * from http where code = 404 and spdy = 1');

    ql.removeAllCondition();
    ql.condition('spdy', 'slow');
    assert.equal(ql.toSelect(), 'select * from http where spdy = \'slow\'');

    ql.removeAllCondition();
    ql.condition('http spdy', 'slow');
    assert.equal(ql.toSelect(), 'select * from http where "http spdy" = \'slow\'');
  });

  it('calculate', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.addCalculate('mean', 'use');
    assert.equal(ql.toSelect(), 'select mean(use) from http');

    ql.addCalculate('count', 'use');
    assert.equal(ql.toSelect(), 'select count(use),mean(use) from http');

    ql.removeCalculate('count', 'use');
    assert.equal(ql.toSelect(), 'select mean(use) from http');

    ql.removeAllCalculate();
    assert.equal(ql.toSelect(), 'select * from http');
  });


  it('group', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.addGroup('spdy');
    ql.addCalculate('mean', 'use');
    assert.equal(ql.toSelect(), 'select mean(use) from http group by spdy');

    ql.addGroup('status', 'time(6h)');
    assert.equal(ql.toSelect(), 'select mean(use) from http group by spdy,status,time(6h)');

    ql.removeGroup('status', 'time(6h)', 'spdy');
    ql.addGroup('ajax status');
    assert.equal(ql.toSelect(), 'select mean(use) from http group by "ajax status"');
  });

  it('fill', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.addCalculate('mean', 'use');
    ql.addGroup('spdy');
    ql.fill = 100;
    assert.equal(ql.toSelect(), 'select mean(use) from http group by spdy fill(100)');
  });

  it('into', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.into = 'http copy';
    assert.equal(ql.toSelect(), 'select * into "http copy" from http');

    ql.addCalculate('mean', 'use');
    ql.condition('spdy', 'slow');
    ql.start = '2015-08-18T00:00:00Z';
    ql.end = '2015-08-18T00:30:00Z';
    ql.addGroup('time(10m)');

    assert.equal(ql.toSelect(), 'select mean(use) into "http copy" from http where spdy = \'slow\' and time <= \'2015-08-18T00:30:00Z\' and time >= \'2015-08-18T00:00:00Z\' group by time(10m)');

  });

  it('order', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.order = 'desc';
    assert.equal(ql.toSelect(), 'select * from http order by time desc');
  });

  it('offset', () => {
    const ql = new QL();
    ql.series = 'http';

    ql.offset = 10;
    assert.equal(ql.toSelect(), 'select * from http offset 10');
  });

  // it('group by', () => {
  //   const ql = new QL();
  //   ql.series = 'http';

  //   ql.calculate('mean', 'use');
  //   assert.equal(ql.toSelect(), 'select mean(use) from http');
  // });

  // it('delete ql', () => {

  // });



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
