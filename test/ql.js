'use strict';
const assert = require('assert');
const QL = require('..');

describe('influxdb-ql', () => {

  it('getter/seter', () => {
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
    attrList.forEach((attr) => {
      const v = 1;
      ql[attr] = v;
      assert.equal(ql[attr], v);
    });
  });

  it('basic query', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.RP = 'default';
    ql.addField('status', 'spdy', 'fetch time');
    ql.addGroup('spdy');
    ql.start = '2018-01-27T05:38:56.145Z';
    ql.end = '-3h';
    ql.limit = 10;
    ql.slimit = 5;
    ql.order = 'desc';
    ql.offset = 10;
    ql.soffset = 5;
    ql.where('code', 400);
    ql.where('"use" <= 30');
    ql.fill = 0;
    assert.equal(ql.toSelect(), 'select "fetch time","spdy","status" from "mydb"."default"."http" where "code" = 400 and "use" <= 30 and time <= now() - 3h and time >= \'2018-01-27T05:38:56.145Z\' group by "spdy" fill(0) order by time desc limit 10 slimit 5 offset 10 soffset 5');
  });

  it('addField', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addField('status', 'spdy', 'fetch time');
    assert.equal(ql.toSelect(), 'select "fetch time","spdy","status" from "mydb".."http"');
  });

  it('addField use alias', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addField({
      'fetch time': 'ft',
    });
    assert.equal(ql.toSelect(), 'select "fetch time" as "ft" from "mydb".."http"');
  });

  it('removeField', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addField('status', 'spdy', 'fetch time');
    ql.removeField('spdy', 'fetch time');
    assert.equal(ql.toSelect(), 'select "status" from "mydb".."http"');
  });

  it('removeField is use alias', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addField({
      'fetch time': 'ft',
    });
    ql.removeField('fetch time');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');
  });

  it('emptyFields', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addField('status', 'spdy', 'fetch time');
    ql.emptyFields();
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');
  });

  it('where("spdy", "1")', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where('spdy', '1');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "spdy" = \'1\'');
  });

  it('where("spdy", ["1", "2"])', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where('spdy', ['1', '2']);
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where ("spdy" = \'1\' or "spdy" = \'2\')');
  });

  it('where("use", 300, ">=")', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where('use', 300, '>=');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "use" >= 300');
  });

  it('where({spdy: "1", method: "GET"})', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where({
      spdy: '1',
      method: 'GET',
    });
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where ("spdy" = \'1\' and "method" = \'GET\')');
  });

  it('where({spdy: "1", method: "GET"}, "!=")', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where({
      spdy: '1',
      method: 'GET',
    }, '!=');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where ("spdy" != \'1\' and "method" != \'GET\')');
  });

  it('where({spdy: "1", method: "GET"}, "or")', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where({
      spdy: '1',
      method: 'GET',
    }, 'or');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where ("spdy" = \'1\' or "method" = \'GET\')');
  });

  it('where("spdy = \'1\' and method = \'GET\'")', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where("spdy = '1' and method = 'GET'");
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where (spdy = \'1\' and method = \'GET\')');
  });

  it('where({spdy: "/1|2/"})', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where({spdy: '/1|2/'});
    ql.where({method: /GET/});
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "method" = /GET/ and "spdy" = /1|2/');
  });

  it('where({path: "/"}', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where({path: '/'});
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "path" = \'/\'');
  });

  it('where({})', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where({});
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');
  });
  it('where({path: false})', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where('path', false);
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "path" = false');
  });
  it('where({path: true})', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where({
      path: true
    });
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "path" = true');
  });

  it('where({code: 0}', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where('code', 0);
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "code" = 0');
  });

  it('call where twice', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where('spdy', '1');
    ql.where('method', 'GET');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "method" = \'GET\' and "spdy" = \'1\'');

    ql.relation = 'or';
    assert.equal(ql.toSelect(), 'select * from "mydb".."http" where "method" = \'GET\' or "spdy" = \'1\'');
  });

  it('emptyConditions', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.where('spdy', '1');
    ql.where('method', 'GET');
    ql.emptyConditions();
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');
  });

  it('addMeasurement', () => {
    const ql = new QL('mydb');
    ql.RP = 'test'
    ql.addMeasurement('http');
    ql.addMeasurement('https', 'httpd');
    assert.equal(ql.toSelect(), 'select * from "mydb"."test"."http","mydb"."test"."https","mydb"."test"."httpd"');
  });

  it('addMeasurement no retention policy', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addMeasurement('https');
    assert.equal(ql.toSelect(), 'select * from "mydb".."http","mydb".."https"');
  });

  it('addMeasurement no db', () => {
    const ql = new QL();
    ql.addMeasurement('http');
    ql.addMeasurement('https');
    assert.equal(ql.toSelect(), 'select * from "http","https"');
  });

  it('removeMeasurement', () => {
    const ql = new QL('mydb');
    ql.addMeasurement('http');
    ql.addMeasurement('https');
    ql.removeMeasurement('http');
    assert.equal(ql.toSelect(), 'select * from "mydb".."https"');
  });

  it('emptyMeasurements', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addMeasurement('https');
    ql.emptyMeasurements();
    assert.equal(ql.toSelect(), 'select * from "mydb"');
  });

  it('addFunction', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addGroup('spdy');
    ql.addFunction('count', 'use');
    assert.equal(ql.toSelect(), 'select count("use") from "mydb".."http" group by "spdy"');
  });

  it('addFunction, multi params', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addFunction('bottom', 'use', 3);
    assert.equal(ql.toSelect(), 'select bottom("use",3) from "mydb".."http"');
  });

  it('addFunction, single param', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addFunction('bottom("use",3)');
    assert.equal(ql.toSelect(), 'select bottom("use",3) from "mydb".."http"');
  });

  it('addFunction and addField', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addFunction('bottom("use",3)');
    ql.addField('spdy');
    assert.equal(ql.toSelect(), 'select "spdy",bottom("use",3) from "mydb".."http"');
  });

  it('addFunction and use alias', () => {
    let ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addFunction('bottom("use",3)', {
      alias: 'bot3Use',
    });
    ql.addField('spdy');
    assert.equal(ql.toSelect(), 'select "spdy",bottom("use",3) as "bot3Use" from "mydb".."http"');

    ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addFunction('bottom', 'use', 3, {
      alias: 'bot3Use',
    });
    ql.addField('spdy');
    assert.equal(ql.toSelect(), 'select "spdy",bottom("use",3) as "bot3Use" from "mydb".."http"');
  });

  it('removeFunction', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addGroup('spdy');
    ql.addFunction('count', 'use');
    ql.addFunction('mean', 'use');
    ql.removeFunction('count', 'use');
    assert.equal(ql.toSelect(), 'select mean("use") from "mydb".."http" group by "spdy"');
  });

  it('removeFunction use alias', () => {
    let ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addFunction('bottom("use",3)', {
      alias: 'bot3Use',
    });
    ql.addField('spdy');
    ql.removeFunction('bottom("use",3)');
    assert.equal(ql.toSelect(), 'select "spdy" from "mydb".."http"');
  });

  it('emptyFunctions', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addGroup('spdy');
    ql.addFunction('count', 'use');
    ql.addFunction('mean', 'use');
    ql.emptyFunctions();
    ql.addFunction('count', 'url');
    assert.equal(ql.toSelect(), 'select count("url") from "mydb".."http" group by "spdy"');
  });

  it('addGroup', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addGroup('spdy', 'method');
    ql.addFunction('count', 'use');
    assert.equal(ql.toSelect(), 'select count("use") from "mydb".."http" group by "method","spdy"');
  });

  it('removeGroup', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addGroup('spdy', 'method');
    ql.addFunction('count', 'use');
    ql.removeGroup('spdy');
    assert.equal(ql.toSelect(), 'select count("use") from "mydb".."http" group by "method"');
  });

  it('emptyGroups', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addGroup('spdy', 'method');
    ql.emptyGroups();
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');
  });

  it('select *', () => {
    const ql = new QL();
    ql.measurement = 'http';
    assert.equal(ql.toSelect(), 'select * from "http"');
  });
  it('set db', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');

    ql.RP = 'rp';
    assert.equal(ql.RP, 'rp');
    assert.equal(ql.toSelect(), 'select * from "mydb"."rp"."http"');
  });
  it('select field', () => {
    const ql = new QL();
    ql.measurement = 'http';
    ql.addField('status');
    assert.equal(ql.toSelect(), 'select "status" from "http"');

    ql.removeField('status');
    assert.equal(ql.toSelect(), 'select * from "http"');

    ql.addField('ajax status');
    assert.equal(ql.toSelect(), 'select "ajax status" from "http"');
  });

  it('select multi fields', () => {
    const ql = new QL();
    ql.measurement = 'http';
    ql.addField('status', 'code');
    assert.equal(ql.toSelect(), 'select "code","status" from "http"');

    ql.removeField('status', 'code');
    assert.equal(ql.toSelect(), 'select * from "http"');
  });

  it('set start and end time', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.start = '2016-03-01 23:32:01.232';
    ql.end = '2016-03-02';
    assert.equal(ql.toSelect(), 'select * from "http" where time <= \'2016-03-02\' and time >= \'2016-03-01 23:32:01.232\'');

    // 3 hours ago
    ql.end = '-3h';
    assert.equal(ql.toSelect(), 'select * from "http" where time <= now() - 3h and time >= \'2016-03-01 23:32:01.232\'');

    // Absolute time
    ql.end = '1388534400s';
    assert.equal(ql.toSelect(), 'select * from "http" where time <= 1388534400s and time >= \'2016-03-01 23:32:01.232\'');
  });

  it('set limit', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.limit = 10;

    assert.equal(ql.toSelect(), 'select * from "http" limit 10');
  });

  it('set slimit', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.addGroup('*');
    ql.slimit = 10;

    assert.equal(ql.toSelect(), 'select * from "http" group by * slimit 10');

    ql.limit = 5;
    assert.equal(ql.toSelect(), 'select * from "http" group by * limit 5 slimit 10');
  });

  it('add conditions', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.where({
      code: 500,
      spdy: '1',
    });
    assert.equal(ql.toSelect(), 'select * from "http" where ("code" = 500 and "spdy" = \'1\')');

    ql.where('code', 404);
    ql.relation = 'or';
    assert.equal(ql.toSelect(), 'select * from "http" where "code" = 404 or ("code" = 500 and "spdy" = \'1\')');

    ql.emptyConditions();
    ql.where('spdy', 'slow');
    assert.equal(ql.toSelect(), 'select * from "http" where "spdy" = \'slow\'');

    ql.emptyConditions();
    ql.where('http spdy', 'slow');
    assert.equal(ql.toSelect(), 'select * from "http" where "http spdy" = \'slow\'');

    ql.emptyConditions();
    ql.where('field_or_tag', '"field_or_tag"', '| 10 =');
    assert.equal(ql.toSelect(), 'select * from "http" where "field_or_tag" | 10 = "field_or_tag"');
  });
  it('add or where', () => {
    const ql = new QL();
    ql.measurement = 'http';
    ql.where('spdy', ['slow', 'fast']);
    assert.equal(ql.toSelect(), 'select * from "http" where ("spdy" = \'slow\' or "spdy" = \'fast\')');
  });


  it('function', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.addFunction('mean', 'use');
    assert.equal(ql.toSelect(), 'select mean("use") from "http"');

    ql.addFunction('count', 'use');
    assert.equal(ql.toSelect(), 'select count("use"),mean("use") from "http"');

    ql.removeFunction('count', 'use');
    assert.equal(ql.toSelect(), 'select mean("use") from "http"');

    ql.emptyFunctions();
    assert.equal(ql.toSelect(), 'select * from "http"');
  });


  it('group', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.addGroup('spdy');
    ql.addFunction('mean', 'use');
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "spdy"');

    ql.addGroup('status', 'time(6h)');
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "spdy","status",time(6h)');

    ql.removeGroup('status', 'time(6h)', 'spdy');
    ql.addGroup('ajax status');
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "ajax status"');

    ql.addGroup('time(6h, 10m)', 'spdy')
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "ajax status","spdy",time(6h, 10m)');
  });

  it('fill', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.addFunction('mean', 'use');
    ql.addGroup('spdy');
    ql.fill = 100;
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "spdy" fill(100)');
  });

  it('into', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.into = 'http copy';
    assert.equal(ql.toSelect(), 'select * into "http copy" from "http"');

    ql.addFunction('mean', 'use');
    ql.where('spdy', 'slow');
    ql.start = '2015-08-18T00:00:00Z';
    ql.end = '2015-08-18T00:30:00Z';
    ql.addGroup('time(10m)');

    assert.equal(ql.toSelect(), 'select mean("use") into "http copy" from "http" where "spdy" = \'slow\' and time <= \'2015-08-18T00:30:00Z\' and time >= \'2015-08-18T00:00:00Z\' group by time(10m)');

  });


  it('from custom rp into', () => {
    const ql = new QL();
    ql.measurement = 'http';
    ql.database = 'mydb';
    ql.rp = 'my-rp';

    assert.equal(ql.database, 'mydb');

    ql.into = 'http copy';
    assert.equal(ql.toSelect(), 'select * into "http copy" from "mydb".."http"');

    ql.intoDatabase = 'mydb';
    ql.intoRP = 'my-rp';
    assert.equal(ql.intoRP, 'my-rp');
    assert.equal(ql.toSelect(), 'select * into "mydb"."my-rp"."http copy" from "mydb".."http"');
  });

  it('order', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.order = 'desc';
    assert.equal(ql.toSelect(), 'select * from "http" order by time desc');
  });

  it('offset', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.offset = 10;
    assert.equal(ql.toSelect(), 'select * from "http" offset 10');
  });

  it('clean', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addField('fetch time');
    ql.addGroup('spdy');
    assert.equal(ql.toSelect(), 'select "fetch time" from "mydb".."http" group by "spdy"');
    ql.clean();
    assert.equal(ql.toSelect(), 'select * from "mydb".."http"');
  });

  it('subQuery', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addFunction('max', 'fetch time');
    ql.addGroup('spdy');
    ql.subQuery();
    ql.addFunction('sum', 'max');
    assert.equal(ql.toSelect(), 'select sum("max") from (select max("fetch time") from "mydb".."http" group by "spdy")');
  });


  it('multiQuery', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    ql.addFunction('max', 'fetch time');
    ql.addGroup('spdy');
    ql.multiQuery();
    ql.addFunction('sum', 'max');
    assert.equal(ql.toSelect(), 'select max("fetch time") from "mydb".."http" group by "spdy";select sum("max") from "mydb".."http"');
  });

  it('CQ', () => {
    const ql = new QL();
    ql.measurement = 'http';
    ql.database = 'mydb';
    ql.intoDatabase = 'mydb';
    ql.into = 'http copy';

    ql.cqName = 'combine-http';
    ql.cqEvery = '2m';
    ql.cqFor = '1m';

    ql.addFunction('count', 'use');
    ql.addGroup('time(5m)');

    assert.equal(ql.toCQ(), 'create continuous query "combine-http" on "mydb" resample every 2m for 1m begin select count("use") into "mydb".."http copy" from "mydb".."http" group by time(5m) end');
  });

  it('createDatabase', () => {
    assert.equal(QL.createDatabase('mydb'), 'create database mydb');
  });

  it('createDatabaseNotExists', () => {
    assert.equal(QL.createDatabaseNotExists('mydb'), 'create database if not exists mydb');
    assert.equal(QL.createDatabaseNotExists('my db'), 'create database if not exists "my db"');
  });

  it('dropDatabase', () => {
    assert.equal(QL.dropDatabase('mydb'), 'drop database mydb');
    assert.equal(QL.dropDatabase('my db'), 'drop database "my db"');
  });

  it('showDatabases', () => {
    assert.equal(QL.showDatabases(), 'show databases');
  });

  it('showRetentionPolicies', () => {
    assert.equal(QL.showRetentionPolicies('mydb'), 'show retention policies on mydb');
    assert.equal(QL.showRetentionPolicies('my db'), 'show retention policies on "my db"');
  });

  it('showMeasurements', () => {
    assert.equal(QL.showMeasurements(), 'show measurements');
  });

  it('showTagKeys', () => {
    assert.equal(QL.showTagKeys(), 'show tag keys');
    assert.equal(QL.showTagKeys('http'), 'show tag keys from "http"');
    assert.equal(QL.showTagKeys('http measurement'), 'show tag keys from "http measurement"');
  });

  it('showFieldKeys', () => {
    assert.equal(QL.showFieldKeys(), 'show field keys');
    assert.equal(QL.showFieldKeys('http'), 'show field keys from "http"');
    assert.equal(QL.showFieldKeys('http measurement'), 'show field keys from "http measurement"');
  });

  it('showSeries', () => {
    assert.equal(QL.showSeries(), 'show series');
    assert.equal(QL.showSeries('http'), 'show series from "http"');
    assert.equal(QL.showSeries('http measurement'), 'show series from "http measurement"');
  });

  it('createRP', () => {
    assert.equal(QL.createRP('two_hours', 'mydb', '2h'), 'create retention policy "two_hours" on "mydb" duration 2h replication 1');

    assert.equal(QL.createRP('two_hours', 'mydb', '2h', 1, true), 'create retention policy "two_hours" on "mydb" duration 2h replication 1 default');
    assert.equal(QL.createRP('two_hours', 'mydb', '2h', true, 2), 'create retention policy "two_hours" on "mydb" duration 2h replication 2 default');

    assert.equal(QL.createRP('two_hours', 'mydb', '2d', '1h', true, 2), 'create retention policy "two_hours" on "mydb" duration 2d replication 2 shard duration 1h default');
  });

  it('dropRP', () => {
    assert.equal(QL.dropRP('two_hours', 'mydb'), 'drop retention policy "two_hours" on "mydb"');
  });

  it('updateRP', () => {
    assert.equal(QL.updateRP('two_hours', 'mydb', '0', 1, '5m', false), 'alter retention policy "two_hours" on "mydb" replication 1 shard duration 5m');

    assert.equal(QL.updateRP('two_hours', 'mydb', '2w', 1, '5m', true), 'alter retention policy "two_hours" on "mydb" duration 2w replication 1 shard duration 5m default');
  });
});

