// static functions
'use strict';
const QL = require('..');

// create database
QL.createDatabase('mydb'); // create database "mydb"

// create database if not exists
QL.createDatabaseNotExists('mydb'); // create database if not exists "mydb"

// drop database
QL.dropDatabase('mydb'); // drop database "mydb"

// show all databases
QL.showDatabases(); // show databases

// show retention policies of the database
QL.showRetentionPolicies('mydb'); // show retention policies on "mydb"

// show measurements of current database
QL.showMeasurements(); // show measurements

// show all tag keys of current database
QL.showTagKeys(); // show tag keys

// show all tag keys of the measurement
QL.showTagKeys('http'); // show tag keys from "http"

// show all field keys of current database
QL.showFieldKeys(); // show field keys

// show all field keys of the measurement
QL.showFieldKeys('http'); // show field keys from "http"

// show all series of current database
QL.showSeries(); // show series

// show all series of the measurement
QL.showSeries('http'); // show series from "http"
