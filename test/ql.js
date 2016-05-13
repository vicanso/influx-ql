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
      'offset',
      'rp'
    ];
    attrList.forEach(attr => {
      const v = 1;
      ql[attr] = v;
      assert.equal(ql[attr], v);
    });
  });


  it('select *', () => {
    const ql = new QL();
    ql.measurement = 'http';
    assert.equal(ql.toSelect(), 'select * from http');
  });

  it('set db', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    assert.equal(ql.measurement, 'http');
    assert.equal(ql.toSelect(), 'select * from mydb."default".http');

    ql.RP = 'rp';
    assert.equal(ql.RP, 'rp');
    assert.equal(ql.toSelect(), 'select * from mydb.rp.http');
  });

  it('select field', () => {
    const ql = new QL();
    ql.measurement = 'http';
    ql.addField('status');
    assert.equal(ql.toSelect(), 'select status from http');

    ql.removeField('status');
    assert.equal(ql.toSelect(), 'select * from http');

    ql.addField('ajax status');
    assert.equal(ql.toSelect(), 'select "ajax status" from http');
  });

  it('select multi fields', () => {
    const ql = new QL();
    ql.measurement = 'http';
    ql.addField('status', 'code');
    assert.equal(ql.toSelect(), 'select code,status from http');

    ql.removeField('status', 'code');
    assert.equal(ql.toSelect(), 'select * from http');
  });

  it('set start and end time', () => {
    const ql = new QL();
    ql.measurement = 'http';

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
    ql.measurement = 'http';

    ql.limit = 10;

    assert.equal(ql.toSelect(), 'select * from http limit 10');
  });

  it('set slimit', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.addGroup('*');
    ql.slimit = 10;

    assert.equal(ql.toSelect(), 'select * from http group by * slimit 10');

    ql.limit = 5;
    assert.equal(ql.toSelect(), 'select * from http group by * limit 5 slimit 10');
  });

  it('add conditions', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.addCondition('code = 500', 'spdy = 1');
    assert.equal(ql.toSelect(), 'select * from http where code = 500 and spdy = 1');

    ql.removeCondition('code = 500');
    ql.condition('code', 404);
    assert.equal(ql.toSelect(), 'select * from http where code = 404 and spdy = 1');

    ql.removeAllCondition();
    ql.condition("spdy = 'slow'");
    assert.equal(ql.toSelect(), 'select * from http where spdy = \'slow\'');

    ql.removeAllCondition();
    ql.condition('http spdy', 'slow');
    assert.equal(ql.toSelect(), 'select * from http where "http spdy" = \'slow\'');
  });

  it('set tag condition', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.tag('spdy', 'slow');
    ql.tag({
      type: '0'
    });

    assert.equal(ql.toSelect(), 'select * from http where spdy = \'slow\' and type = \'0\'');
  });

  it('set field condition', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.field('use', 3000);
    ql.field({
      code: 400
    });

    assert.equal(ql.toSelect(), 'select * from http where code = 400 and use = 3000');
  });

  it('calculate', () => {
    const ql = new QL();
    ql.measurement = 'http';

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
    ql.measurement = 'http';

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
    ql.measurement = 'http';

    ql.addCalculate('mean', 'use');
    ql.addGroup('spdy');
    ql.fill = 100;
    assert.equal(ql.toSelect(), 'select mean(use) from http group by spdy fill(100)');
  });

  it('into', () => {
    const ql = new QL();
    ql.measurement = 'http';

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
    ql.measurement = 'http';

    ql.order = 'desc';
    assert.equal(ql.toSelect(), 'select * from http order by time desc');
  });

  it('offset', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.offset = 10;
    assert.equal(ql.toSelect(), 'select * from http offset 10');
  });

  it('createDatabase', () => {
    assert.equal(QL.createDatabase('mydb'), 'create database "mydb"');
  });

  it('createDatabaseNotExists', () => {
    assert.equal(QL.createDatabaseNotExists('mydb'), 'create database if not exists "mydb"');
  });

  it('dropDatabase', () => {
    assert.equal(QL.dropDatabase('mydb'), 'drop database "mydb"');
  });

  it('showDatabases', () => {
    assert.equal(QL.showDatabases(), 'show databases');
  });

  it('showRetentionPolicies', () => {
    assert.equal(QL.showRetentionPolicies('mydb'), 'show retention policies on "mydb"');
  });

  it('showMeasurements', () => {
    assert.equal(QL.showMeasurements(), 'show measurements');
  });

  it('showTagKeys', () => {
    assert.equal(QL.showTagKeys(), 'show tag keys');
    assert.equal(QL.showTagKeys('http'), 'show tag keys from "http"');
  });

  it('showFieldKeys', () => {
    assert.equal(QL.showFieldKeys(), 'show field keys');
    assert.equal(QL.showFieldKeys('http'), 'show field keys from "http"');
  });

  it('showSeries', () => {
    assert.equal(QL.showSeries(), 'show series');
    assert.equal(QL.showSeries('http'), 'show series from "http"');
  });
});
