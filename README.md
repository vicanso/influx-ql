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
ql.condition('code', 400);
ql.condition('"use" <= 30');
ql.fill = 0;
// select "fetch time","spdy","status" from "mydb"."default"."http" where "code" = 400 and "use" <= 30 and time <= now() - 3h and time >= '2016-01-01' order by time desc limit 10 slimit 5 offset 10 soffset 5
ql.toSelect();
```

## Installation

```bash
$ npm i influx-ql
```

## Examples
  
View the [./examples](examples) directory for working examples. 

## API

[API](https://vicanso.github.io/influxdb-ql/QL.html)

## License

MIT
