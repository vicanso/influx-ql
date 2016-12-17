'use strict';
const QL = require('..');
const ql = new QL('mydb');

ql.measurement = 'http';
ql.start = '2016-04-01';
ql.end = '-3h';
ql.addFunction('count', 'code');
ql.addGroup('time(6h)');
// select count(code) from mydb."default".http where time <= now() - 3h and time >= '2016-04-01' group by time(6h)
ql.toSelect();
