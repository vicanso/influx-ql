'use strict';
const QL = require('..');
const ql = new QL('mydb');

ql.measurement = 'http';
ql.start = '2016-04-01';
ql.addCalculate('count', 'code');
ql.addGroup('time(6h)');
ql.toSelect(); // select count(code) from mydb."default".http where time >= '2016-04-01' group by time(6h)


