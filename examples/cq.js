'use strict';

const QL = require('..');

const ql = new QL('mydb');

ql.addMeasurement('http');
ql.into = 'http-count';

ql.cqName = 'http-count-cq';

ql.addFunction('count', 'use');
ql.addGroup('time(5m)');
ql.start = '-5m';
ql.cqEvery = '5m';
// create continuous query "http-count-cq" on mydb resample every 5m begin select count(use) into mydb."default"."http-count" from mydb."default".http where time >= now() - 5m group by time(5m) end
ql.toCQ();
