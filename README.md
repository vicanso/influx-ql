# Influx-ql

Get influx ql

```js
const QL = require('influx-ql');
const ql = new QL();
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
// select "fetch time",spdy,status from http where code = 400 and time <= now() - 3h and time >= '2016-01-01' and use <= 30 group by time(6h) fill(0) limit 10 slimit 5
ql.toSelect();
```

## Installation

```bash
$ npm i influx-ql
```

## License

MIT