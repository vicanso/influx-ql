'use strict';
const QL = require('..');
const ql = new QL('mydb');

ql.measurement = 'http';
ql.start = '2016-04-01';
ql.addFunction('count', 'code');
ql.addGroup('time(6h)', 'spdy', 'method');
// select count(code) from mydb."default".http where time >= '2016-04-01' group by method,spdy,time(24h)
ql.toSelect();
