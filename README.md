# Influx-ql [![Build Status](https://travis-ci.org/vicanso/influx-ql.svg?branch=master)](https://travis-ci.org/vicanso/influx-ql)

Get influx ql

```js
const QL = require('influx-ql');
const ql = new QL('mydb');
ql.series = 'http';
ql.addField('status', 'spdy', 'fetch time');
ql.start = '2016-01-01';
ql.end = '-3h';
ql.limit = 10;
ql.slimit = 5;
ql.condition('code', 400);
ql.addCondition('use <= 30');
ql.addGroup('time(6h)');
ql.fill = 0;
// select "fetch time",spdy,status from mydb."default".http where code = 400 and time <= now() - 3h and time >= '2016-01-01' and use <= 30 group by time(6h) fill(0) limit 10 slimit 5
ql.toSelect();
```

## Installation

```bash
$ npm i influx-ql

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

### series

set/get series

```js
const QL = require('influx-ql');
const ql = new QL();
ql.series = 'http';
// http
console.info(ql.series);
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

add group by field

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
ql.series = 'http';
ql.addField('status', 'spdy', 'fetch time');
ql.start = '2016-01-01';
ql.end = '-3h';
ql.limit = 10;
ql.slimit = 5;
ql.condition('code', 400);
ql.addCondition('use <= 30');
ql.addGroup('time(6h)');
ql.fill = 0;
// select "fetch time",spdy,status from mydb."default".http where code = 400 and time <= now() - 3h and time >= '2016-01-01' and use <= 30 group by time(6h) fill(0) limit 10 slimit 5
ql.toSelect();
```

## License

MIT