# Influx-ql 

[![Build Status](https://travis-ci.org/vicanso/influx-ql.svg?style=flat-square)](https://travis-ci.org/vicanso/influx-ql)
[![npm](http://img.shields.io/npm/v/influx-ql.svg?style=flat-square)](https://www.npmjs.org/package/influx-ql)
[![Github Releases](https://img.shields.io/npm/dm/influx-ql.svg?style=flat-square)](https://github.com/vicanso/influx-ql)

[Influxdb-nodejs](https://github.com/vicanso/influxdb-nodejs) An Influxdb Node.js Client depends on Influx-ql.


Get influx ql

```js
const QL = require('influx-ql');
const ql = new QL('mydb');
ql.measurement = 'http';
ql.addField('status', 'spdy', 'fetch time');
ql.start = '2016-01-01';
ql.end = '-3h';
ql.limit = 10;
ql.slimit = 5;
ql.condition('code', 400);
ql.addCondition('use <= 30');
ql.fill = 0;
// select "fetch time",spdy,status from mydb."default".http where code = 400 and time <= now() - 3h and time >= '2016-01-01' and use <= 30 fill(0) limit 10 slimit 5
ql.toSelect();
```

## Installation

```bash
$ npm i influx-ql
```

## Examples
  
View the [./examples](examples) directory for working examples. 

## API

### constructor

new Influx-ql Instance

- `db` ql database, optional

```js
const QL = require('influx-ql');
const ql = new QL('mydb');
```

### RP

set/get retention policy

```js
const QL = require('influx-ql');
const ql = new QL('mydb');
ql.RP = 'rp-test';
// rp-test
console.info(ql.RP);
```

### measurement

set/get measurement

```js
const QL = require('influx-ql');
const ql = new QL();
ql.measurement = 'http';
// http
console.info(ql.measurement);
```

### start

set/get start time, applicable for 3 formats, eg: '-3h', '2016-03-01 23:32:01.232', '1388534400s' 

```js
const QL = require('influx-ql');
const ql = new QL();
// 3 hours ago, 
ql.start = '-3h';
// YYYY-MM-DD HH:mm:SS.sss
ql.start = '2016-03-01';
// absolute time
ql.start = '1388534400s';
```

### end

set/get end time, the same as `start`

```js
const QL = require('influx-ql');
const ql = new QL();
ql.end = '-1d';
```

### limit

set/get limit value

```js
const QL = require('influx-ql');
const ql = new QL();
ql.limit = 10;
```

### slimit

set/get slimit value

```js
const QL = require('influx-ql');
const ql = new QL();
ql.slimit = 10;
```

### fill

set/get fill value

```js
const QL = require('influx-ql');
const ql = new QL();
ql.fill = 1;
```

### order

set/get time sort order, eg: 'asc', 'desc'

```js
const QL = require('influx-ql');
const ql = new QL();
ql.order = 'desc';
```

### offset

set/get offset value

```js
const QL = require('influx-ql');
const ql = new QL();
ql.offset = 10;
```

### addField

add query result field, if fields is empty, will get all fields.

```js
const QL = require('influx-ql');
const ql = new QL();
ql.addField('status', 'http');
```

### removeField

remove query result field

```js
const QL = require('influx-ql');
const ql = new QL();
ql.addField('status');
ql.removeField('status');
```

### addCondition

add custom query condition

```js
const QL = require('influx-ql');
const ql = new QL();
ql.addCondition('code = 500', 'spdy = 1');
```

### removeCondition

remove custom query condition

```js
const QL = require('influx-ql');
const ql = new QL();
ql.addCondition('code = 500', 'spdy = 1');
ql.removeCondition('code = 500');
```

### removeAllCondition

remove all custom query condition

```js
const QL = require('influx-ql');
const ql = new QL();
ql.addCondition('code = 500', 'spdy = 1');
ql.removeAllCondition();
```

### condition

- `key` query field name

- `value` query field value

add custom query condition, the same as `addCondition(key + '=' + value)`

```js
const QL = require('influx-ql');
const ql = new QL();
ql.condition('code', 500);
ql.condition({
  spdy: 'fast',
  type: '1',
});
```

### tag

- `key` query tag name

- `value` query tag value

add tag query condition, the same as `condition`

```js
const QL = require('influx-ql');
const ql = new QL();
ql.tag('spdy', 'slow');
ql.tag({
  type: '0',
});
```

### field

- `key` query field name

- `value` query field value

add field query condition, the same as `condition`

```js
const QL = require('influx-ql');
const ql = new QL();
ql.field('use', 3000);
ql.field({
  code: 400,
});
```

### addCalculate

- `type` calculate type

- `field` calculate field

add query calculate

```js
const QL = require('influx-ql');
const ql = new QL();
ql.addCalculate('mean', 'use');
```

### removeCalculate

- `type` calculate type

- `field` calculate field

remove query calculate

```js
const QL = require('influx-ql');
const ql = new QL();
ql.addCalculate('mean', 'use');
ql.removeCalculate('mean', 'use');
```

### removeAllCalculate

remove all calculate

```js
const QL = require('influx-ql');
const ql = new QL();
ql.addCalculate('mean', 'use');
ql.removeAllCalculate();
```

### addGroup

add group by field and it must be used with `addCalculate`

```js
const QL = require('influx-ql');
const ql = new QL();
ql.addGroup('spdy', 'time(6h)');
```

### removeGroup

remove group by field

```js
const QL = require('influx-ql');
const ql = new QL();
ql.addGroup('spdy', 'time(6h)');
ql.removeGroup('spdy');
```


### toSelect

get select query string

```js
const QL = require('influx-ql');
const ql = new QL('mydb');
ql.measurement = 'http';
ql.addField('status', 'spdy', 'fetch time');
ql.start = '2016-01-01';
ql.end = '-3h';
ql.limit = 10;
ql.slimit = 5;
ql.condition('code', 400);
ql.addCondition('use <= 30');
ql.fill = 0;
// select "fetch time",spdy,status from mydb."default".http where code = 400 and time <= now() - 3h and time >= '2016-01-01' and use <= 30 fill(0) limit 10 slimit 5
ql.toSelect();
```

### createDatabase

- `db` database

create database, if exists, an error will be thrown. 

```js
QL.createDatabase('mydb'); // create database mydb
```

### createDatabaseNotExists

- `db` database

create database if not exists

```js
QL.createDatabaseNotExists('mydb'); // create database if not exists mydb
```

### dropDatabase

- `db` database

drop database

```js
QL.dropDatabase('mydb'); // drop database mydb
```

### showDatabases

show databases

```js
QL.showDatabases(); // show databases
```

### showRetentionPolicies

- `db` database

show retention policies

```js
QL.showRetentionPolicies('mydb'); // show retention policies on mydb
```

### showMeasurements

show measurements

```js
QL.showMeasurements(); // show measurements
```

### showTagKeys

- `measurement` measurement [optional]

show tag keys

```js
QL.showTagKeys(); // show tag keys
QL.showTagKeys('http'); // show tag keys from "http"
```

### showFieldKeys

- `measurement` measurement [optional]

show field keys

```js
QL.showFieldKeys(); // show field keys
QL.showFieldKeys('http'); // show field keys from "http"
```

### showSeries

- `measurement` measurement [optional]

```js
QL.showSeries(); // show series
QL.showSeries('http'); // show series from "http"
```

## License

MIT
