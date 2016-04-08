'use strict';
const internal = require('./internal');

function validate(data, keys) {
  const notSetKeys = [];
  keys.forEach(key => {
    if (!data[key]) {
      notSetKeys.push(key);
    }
  });
  if (notSetKeys.length) {
    throw new Error(`${notSetKeys.join(',')} can not be null`);
  }
}

function getTimeCondition(time, type) {
  let timeDesc = '';
  if (time.charAt(0) === '-') {
    timeDesc = `now() - ${time.substring(1)}`;
  } else if (/\d{4}-\d{2}-\d{2}/.test(time)) {
    timeDesc = `'${time}'`;
  } else {
    timeDesc = time;
  }
  return `time ${type} ${timeDesc}`;
}

function addToArray(arr, args) {
  if (args && args.length) {
    arr.push.apply(arr, args);
  }
}

function removeFromArray(arr, args) {
  return arr.filter(item => !~args.indexOf(item));
}

function getQL(data) {
  validate(data, ['series']);
  const arr = [];
  arr.push(`from "${data.series.replace(/"/g, '\\"')}"`);

  const conditions = data.conditions.slice();
  if (data.start) {
    conditions.push(getTimeCondition(data.start, '>'));
  }
  if (data.end) {
    conditions.push(getTimeCondition(data.end, '<'));
  }

  if (conditions.length) {
    arr.push(`where ${conditions.sort().join(' and ')}`);
  }

  if (data.limit) {
    arr.push(`limit ${data.limit}`);
  }

  return arr.join(' ');
}

class QL {
  constructor() {
    const data = internal(this);
    data.fields = [];
    data.conditions = [];
  }
  set series(v) {
    if (v) {
      internal(this).series = v;
    }
    return this;
  }

  get series() {
    return internal(this).series;
  }

  set start(v) {
    internal(this).start = v;
    return this;
  }

  get start() {
    return internal(this).start;
  }

  set end(v) {
    internal(this).end = v;
    return this;
  }

  get end() {
    return internal(this).end;
  }

  set limit(v) {
    internal(this).limit = v;
    return this;
  }

  get limit() {
    return internal(this).limit;
  }

  addField() {
    addToArray(internal(this).fields, Array.from(arguments));
    return this;
  }

  removeField() {
    const data = internal(this);
    data.fields = removeFromArray(data.fields, Array.from(arguments));
    return this;
  }

  addCondition() {
    addToArray(internal(this).conditions, Array.from(arguments));
    return this;
  }

  removeCondition() {
    const data = internal(this);
    data.conditions = removeFromArray(data.conditions, Array.from(arguments));
    return this;
  }

  condition(k, v) {
    if (k && v) {
      this.addCondition(`${k} = ${v}`);
    }
    return this;
  }

  toSelect() {
    const data = internal(this);
    const arr = ['select'];
    const fields = data.fields;
    if (fields && fields.length) {
      arr.push(fields.sort().join(','));
    } else {
      arr.push('*');
    }
    return arr.concat(getQL(data)).join(' ');
  }

  static listSeries() {
    return 'select * from /.*/ limit 1';
  }
  // static createDatabase(db) {
  //   return `create database ${db}`;
  // }

  // static createDatabaseNotExists(db) {
  //   return `create database if not exists ${db}`;
  // }

  // static showRetentionPolicies(db) {
  //   return `SHOW RETENTION POLICIES ON "${db}"`;
  // }

  // static showDatabases() {
  //   return 'SHOW DATABASES';
  // }

  // static showTagKeys() {
  //   return 'SHOW TAG KEYS';
  // }
}

module.exports = QL;
