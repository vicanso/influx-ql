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
    assert.equal(ql.toSelect(), 'select * from "http"');
  });

  it('set db', () => {
    const ql = new QL('mydb');
    ql.measurement = 'http';
    assert.equal(ql.measurement, 'http');
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

    ql.addCondition('"code" = 500', '"spdy" = 1');
    assert.equal(ql.toSelect(), 'select * from "http" where "code" = 500 and "spdy" = 1');

    ql.removeCondition('"code" = 500');
    ql.condition('code', 404);
    assert.equal(ql.toSelect(), 'select * from "http" where "code" = 404 and "spdy" = 1');

    ql.removeAllCondition();
    ql.condition('spdy', 'slow');
    assert.equal(ql.toSelect(), 'select * from "http" where "spdy" = \'slow\'');

    ql.removeAllCondition();
    ql.condition('http spdy', 'slow');
    assert.equal(ql.toSelect(), 'select * from "http" where "http spdy" = \'slow\'');
  });

  it('add or condition', () => {
    const ql = new QL();
    ql.measurement = 'http';
    ql.condition('spdy', ['slow', 'fast']);
    assert.equal(ql.toSelect(), 'select * from "http" where ("spdy" = \'slow\' or "spdy" = \'fast\')');
  });

  it('set tag condition', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.tag('spdy', 'slow');
    ql.tag({
      type: '0'
    });

    assert.equal(ql.toSelect(), 'select * from "http" where "spdy" = \'slow\' and "type" = \'0\'');
  });

  it('set field condition', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.field('use', 3000);
    ql.field({
      code: 400
    });

    assert.equal(ql.toSelect(), 'select * from "http" where "code" = 400 and "use" = 3000');
  });

  it('calculate', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.addCalculate('mean', 'use');
    assert.equal(ql.toSelect(), 'select mean("use") from "http"');

    ql.addCalculate('count', 'use');
    assert.equal(ql.toSelect(), 'select count("use"),mean("use") from "http"');

    ql.removeCalculate('count', 'use');
    assert.equal(ql.toSelect(), 'select mean("use") from "http"');

    ql.removeAllCalculate();
    assert.equal(ql.toSelect(), 'select * from "http"');
  });


  it('group', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.addGroup('spdy');
    ql.addCalculate('mean', 'use');
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "spdy"');

    ql.addGroup('status', 'time(6h)');
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "spdy","status",time(6h)');

    ql.removeGroup('status', 'time(6h)', 'spdy');
    ql.addGroup('ajax status');
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "ajax status"');
  });

  it('fill', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.addCalculate('mean', 'use');
    ql.addGroup('spdy');
    ql.fill = 100;
    assert.equal(ql.toSelect(), 'select mean("use") from "http" group by "spdy" fill(100)');
  });

  it('into', () => {
    const ql = new QL();
    ql.measurement = 'http';

    ql.into = 'http copy';
    assert.equal(ql.toSelect(), 'select * into "http copy" from "http"');

    ql.addCalculate('mean', 'use');
    ql.condition('spdy', 'slow');
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



  it('CQ', () => {
    const ql = new QL();
    ql.measurement = 'http';
    ql.database = 'mydb';
    ql.intoDatabase = 'mydb';
    ql.into = 'http copy';

    ql.cqName = 'combine-http';
    ql.cqEvery = '2m';
    ql.cqFor = '1m';

    ql.addCalculate('count', 'use');
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

describe('influxdb/data_exploration', () => {

  it('The basic SELECT statement', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';
    ql.addField('level description', 'location', 'water_level');
    assert.equal(ql.toSelect(), 'select "level description","location","water_level" from "h2o_feet"');
  });

  it('The SELECT statement and arithmetic', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';

    // Perform basic arithmetic operations on fields that store floats and integers.
    ql.addField('"water_level" + 2');
    assert.equal(ql.toSelect(), 'select "water_level" + 2 from "h2o_feet"');

    ql.removeField('"water_level" + 2');
    ql.addField('("water_level" * 2) + 4');
    assert.equal(ql.toSelect(), 'select ("water_level" * 2) + 4 from "h2o_feet"');
  });

  it('The WHERE clause', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';

    // Return data where the tag key location has the tag value santa_monica:
    ql.addField('water_level');
    ql.condition('location', 'santa_monica');
    assert.equal(ql.toSelect(), 'select "water_level" from "h2o_feet" where "location" = \'santa_monica\'');

    // Return data where the tag key location has no tag value (more on regular expressions later):
    ql.removeAllCondition();
    ql.removeField('water_level');
    ql.condition('location', '/./', '!~');
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where "location" !~ /./');

    // Return data where the tag key location has no tag value (more on regular expressions later):
    ql.removeAllCondition();
    ql.condition('location', '/./', '=~');
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where "location" =~ /./');

    // Return data from the past seven days:
    ql.removeAllCondition();
    ql.start = '-7d';
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where time >= now() - 7d');

    // Return data where the tag key location has the tag value coyote_creek and the field water_level is greater than 8 feet:
    ql.start = null;
    ql.condition('location', 'coyote_creek');
    ql.condition('water_level', 8, '>');
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where "location" = \'coyote_creek\' and "water_level" > 8');

    // Return data where the tag key location has the tag value santa_monica and the field level description equals 'below 3 feet':
    ql.removeAllCondition();
    ql.condition('location', 'santa_monica');
    ql.condition('level description', 'below 3 feet');
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where "level description" = \'below 3 feet\' and "location" = \'santa_monica\'');

    // Return data where the field values in water_level plus 2 are greater than 11.9
    ql.removeAllCondition();
    ql.condition('"water_level" + 2', 11.9, '>');
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" where "water_level" + 2 > 11.9');
  });

  it('The GROUP BY clause', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';

    // Calculate the MEAN() water_level for the different tag values of location:
    ql.addCalculate('mean', 'water_level');
    ql.addGroup('location');
    assert.equal(ql.toSelect(), 'select mean("water_level") from "h2o_feet" group by "location"');

    // Calculate the MEAN() index for every tag set in h2o_quality:
    ql.removeAllCalculate();
    ql.removeAllGroup();
    ql.addCalculate('mean', 'index');
    ql.addGroup('*');
    assert.equal(ql.toSelect(), 'select mean("index") from "h2o_feet" group by *');

    // COUNT() the number of water_level points between August 19, 2015 at midnight and August 27 at 5:00pm at three day intervals:
    ql.removeAllCalculate();
    ql.removeAllGroup();
    ql.addCalculate('count', 'water_level');
    ql.start = '2015-08-19T00:00:00Z';
    ql.end = '2015-08-27T17:00:00Z';
    ql.condition('location', 'coyote_creek');
    ql.addGroup('time(3d)');
    assert.equal(ql.toSelect(), 'select count("water_level") from "h2o_feet" where "location" = \'coyote_creek\' and time <= \'2015-08-27T17:00:00Z\' and time >= \'2015-08-19T00:00:00Z\' group by time(3d)');

    // GROUP BY time() also allows you to alter the default rounded calendar time boundaries by including an offset interval.
    ql.removeAllGroup();
    ql.addGroup('time(3d,1d)');
    assert.equal(ql.toSelect(), 'select count("water_level") from "h2o_feet" where "location" = \'coyote_creek\' and time <= \'2015-08-27T17:00:00Z\' and time >= \'2015-08-19T00:00:00Z\' group by time(3d,1d)');

    // COUNT() the number of water_level points between August 19, 2015 at midnight and August 27 at 5:00pm at three day intervals, and offset the time boundary by -2 days:
    ql.removeAllGroup();
    ql.addGroup('time(3d,-2d)');
    assert.equal(ql.toSelect(), 'select count("water_level") from "h2o_feet" where "location" = \'coyote_creek\' and time <= \'2015-08-27T17:00:00Z\' and time >= \'2015-08-19T00:00:00Z\' group by time(3d,-2d)');
  });

  it('GROUP BY tag values AND a time interval', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';

    // Separate multiple GROUP BY arguments with a comma.
    ql.start = '-2w';
    ql.addCalculate('mean', 'water_level');
    ql.addGroup('location', 'time(6h)');
    assert.equal(ql.toSelect(), 'select mean("water_level") from "h2o_feet" where time >= now() - 2w group by "location",time(6h)');
  });

  it('The GROUP BY clause and fill()', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';

    // GROUP BY with fill()
    ql.addCalculate('mean', 'water_level');
    ql.start = '2015-08-18';
    ql.end = '2015-09-24';
    ql.addGroup('time(10d)');
    ql.fill = -100;
    assert.equal(ql.toSelect(), 'select mean("water_level") from "h2o_feet" where time <= \'2015-09-24\' and time >= \'2015-08-18\' group by time(10d) fill(-100)');

    ql.fill = 'none';
    assert.equal(ql.toSelect(), 'select mean("water_level") from "h2o_feet" where time <= \'2015-09-24\' and time >= \'2015-08-18\' group by time(10d) fill(none)');
  });

  it('The INTO clause', () => {
    const ql = new QL();
    ql.measurement = 'h2o_feet';

    ql.into = 'h2o_feet_copy';
    ql.addField('water_level');
    ql.condition('location', 'coyote_creek');
    assert.equal(ql.toSelect(), 'select "water_level" into "h2o_feet_copy" from "h2o_feet" where "location" = \'coyote_creek\'');


    // Calculate the average water_level in santa_monica, and write the results to a new measurement (average) in the same database:
    ql.removeAllField();
    ql.removeAllCondition();
    ql.into = 'average';
    ql.addCalculate('mean', 'water_level');
    ql.condition('location', 'santa_monica');
    ql.start = '2015-08-18T00:00:00Z';
    ql.end = '2015-08-18T00:30:00Z';
    ql.addGroup('time(12m)');
    assert.equal(ql.toSelect(), 'select mean("water_level") into "average" from "h2o_feet" where "location" = \'santa_monica\' and time <= \'2015-08-18T00:30:00Z\' and time >= \'2015-08-18T00:00:00Z\' group by time(12m)');

    // Calculate the average water_level and the max water_level in santa_monica, and write the results to a new measurement (aggregates) in a different database (where_else):
    ql.removeAllField();
    ql.removeAllCondition();
    ql.removeAllCalculate();
    ql.into = 'aggregates'
    ql.intoDatabase = 'where_else';
    ql.intoRP = 'autogen';
    ql.addCalculate('mean', 'water_level');
    ql.addCalculate('max', 'water_level');
    ql.condition('location', 'santa_monica');
    ql.start = '2015-08-18T00:00:00Z';
    ql.end = '2015-08-18T00:30:00Z';
    ql.addGroup('time(12m)');
    assert.equal(ql.toSelect(), 'select max("water_level"),mean("water_level") into "where_else"."autogen"."aggregates" from "h2o_feet" where "location" = \'santa_monica\' and time <= \'2015-08-18T00:30:00Z\' and time >= \'2015-08-18T00:00:00Z\' group by time(12m),time(12m)');

    ql.removeAllField();
    ql.removeAllCondition();
    ql.removeAllCalculate();
    ql.addCalculate('mean', 'degrees');
    ql.into = ':MEASUREMENT';
    ql.intoDatabase = 'where_else';
    ql.intoRP = 'autogen';
    ql.measurement = '/temperature/';
    ql.start = '2015-08-18T00:00:00Z';
    ql.end = '2015-08-18T00:30:00Z';
    ql.addGroup('time(12m)');
    assert.equal(ql.toSelect(), 'select mean("degrees") into "where_else"."autogen".:MEASUREMENT from /temperature/ where time <= \'2015-08-18T00:30:00Z\' and time >= \'2015-08-18T00:00:00Z\' group by time(12m),time(12m),time(12m)');
  });

  it('Limit the number of results returned per series with LIMIT', () => {
    const ql = new QL();

    // Return the three oldest points from each series associated with the measurement h2o_feet:
    ql.measurement = 'h2o_feet';
    ql.addGroup('*');
    ql.limit = 3;
    assert.equal(ql.toSelect(), 'select * from "h2o_feet" group by * limit 3');
  });

  it('Limit the number of series returned with SLIMIT', () => {
    const ql = new QL();

    // Return everything from one of the series associated with the measurement h2o_feet:
    ql.measurement = 'h2o_feet';
    ql.addField('water_level');
    ql.addGroup('*');
    ql.slimit = 1;
    assert.equal(ql.toSelect(), 'select "water_level" from "h2o_feet" group by * slimit 1');
  });

  it('Limit the number of points and series returned with LIMIT and SLIMIT', () => {
    const ql = new QL();

    // Return the three oldest points from one of the series associated with the measurement h2o_feet:
    ql.addField('water_level');
    ql.measurement = 'h2o_feet';
    ql.addGroup('*');
    ql.limit = 3;
    ql.slimit = 1;
    assert.equal(ql.toSelect(), 'select "water_level" from "h2o_feet" group by * limit 3 slimit 1');
  });

  it('Sort query returns with ORDER BY time DESC', () => {
    const ql = new QL();

    // Now include ORDER BY time DESC to get the newest five points from the same series:
    ql.addField('water_level');
    ql.measurement = 'h2o_feet';
    ql.condition('location', 'santa_monica');
    ql.order = 'desc';
    ql.limit = 5;
    assert.equal(ql.toSelect(), 'select "water_level" from "h2o_feet" where "location" = \'santa_monica\' order by time desc limit 5');
  });

  it('Paginate query returns with OFFSET and SOFFSET', () => {
    const ql = new QL();

    // Then get the second three points from that same series:
    ql.addField('water_level');
    ql.measurement = 'h2o_feet';
    ql.condition('location', 'coyote_creek');
    ql.limit = 3;
    ql.offset = 3;
    assert.equal(ql.toSelect(), 'select "water_level" from "h2o_feet" where "location" = \'coyote_creek\' limit 3 offset 3');

    ql.offset = 0;
    ql.slimit = 1;
    ql.soffset = 1;
    assert.equal(ql.toSelect(), 'select "water_level" from "h2o_feet" where "location" = \'coyote_creek\' limit 3 slimit 1 soffset 1');
  });

  it('double quote identifiers', () => {
    // Double quote identifiers if they start with a digit, contain characters other than [A-z,0-9,_], or if they are an InfluxQL keyword
    function convert(field) {
      const f = field.toLowerCase();
      const digitReg = /^[0-9]/;
      const reg = /[^a-z0-9_]/;
      /* istanbul ignore else */
      if (digitReg.test(f) || reg.test(f)) {
        return `"${field}"`;
      }
      return field;
    }

    assert.equal(convert('012'), '"012"');
    assert.equal(convert('ABab'), 'ABab');
    assert.equal(convert('A-B'), '"A-B"');
    assert.equal(convert('A B'), '"A B"');
  });

});
