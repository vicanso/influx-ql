# Influx-ql

[![Build Status](https://travis-ci.org/vicanso/influx-ql.svg?style=flat-square)](https://travis-ci.org/vicanso/influx-ql)
[![Coverage Status](https://img.shields.io/coveralls/vicanso/influx-ql/master.svg?style=flat)](https://coveralls.io/r/vicanso/influx-ql?branch=master)
[![npm](http://img.shields.io/npm/v/influx-ql.svg?style=flat-square)](https://www.npmjs.org/package/influx-ql)
[![Github Releases](https://img.shields.io/npm/dm/influx-ql.svg?style=flat-square)](https://github.com/vicanso/influx-ql)

[Influxdb-nodejs](https://github.com/vicanso/influxdb-nodejs) An Influxdb Node.js Client depends on Influx-ql.


Get influx ql

```js
const QL = require('influx-ql');
const ql = new QL('mydb');
ql.measurement = 'http';
ql.RP = 'default';
ql.addField('status', 'spdy', 'fetch time');
ql.start = '2016-01-01';
ql.end = '-3h';
ql.limit = 10;
ql.slimit = 5;
ql.order = 'desc';
ql.offset = 10;
ql.soffset = 5;
ql.tz = 'America/Chicago';
ql.where('code', 400);
ql.where('"use" <= 30');
// select "fetch time","spdy","status" from "mydb"."default"."http" where "code" = 400 and "use" <= 30 and time <= now() - 3h and time >= '2016-01-01' order by time desc limit 10 slimit 5 offset 10 soffset 5 tz('America/Chicago')
ql.toSelect();
```

The enhance where function

```js
const QL = require('influx-ql');
const ql = new QL('mydb');
ql.measurement = 'http';

// select * from "mydb".."http" where "spdy" = '1'
ql.where("spdy", "1");
ql.emptyConditions();

// select * from "mydb".."http" where ("spdy" = '1' or "spdy" = '2')
ql.where("spdy", ["1", "2"]);
ql.emptyConditions();

// select * from "mydb".."http" where "use" >= 300
ql.where("use", 300, ">=");
ql.emptyConditions();

// select * from "mydb".."http" where ("spdy" = '1' and "method" = 'GET')
ql.where({spdy: "1", method: "GET"});
ql.emptyConditions();

// select * from "mydb".."http" where ("spdy" != '1' and "method" != 'GET')
ql.where({spdy: "1", method: "GET"}, '!=');
ql.emptyConditions();

// select * from "mydb".."http" where ("spdy" = '1' or "method" = 'GET')
ql.where({spdy: "1", method: "GET"}, "or");
ql.emptyConditions();

// select * from "mydb".."http" where (spdy = '1' and method = 'GET')
ql.where("spdy = '1' and method = 'GET'");
ql.emptyConditions();

// select * from "mydb".."http" where "spdy" = /1|2/
ql.where({spdy: /1|2/});
ql.emptyConditions();

// select * from "mydb".."http" where "method" = 'GET' or "spdy" = '1'
ql.where('spdy', '1');
ql.where('method', 'GET');
ql.relation = 'or';

// select sum("max") from (select max("fetch time") from "mydb".."http" group by "spdy")
ql.clean();
ql.measurement = 'http';
ql.addFunction('max', 'fetch time');
ql.addGroup('spdy');
ql.subQuery();
ql.addFunction('sum', 'max');
```

## Installation

```bash
$ npm i influx-ql
```

## Examples

View the [./examples](examples) directory for working examples.

## API

[API](https://vicanso.github.io/influx-ql/QL.html)

## License

MIT
