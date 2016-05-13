'use strict';
const internal = require('./internal');
const util = require('util');

function validate(data, keys) {
  const notSetKeys = [];
  keys.forEach(key => {
    /* istanbul ignore if */
    if (!data[key]) {
      notSetKeys.push(key);
    }
  });
  /* istanbul ignore if */
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
  /* istanbul ignore else */
  if (args && args.length) {
    arr.push.apply(arr, args);
  }
}

function removeFromArray(arr, args) {
  return arr.filter(item => !~args.indexOf(item));
}

function convert(field) {
  /* istanbul ignore else */
  if (~field.indexOf(' ')) {
    return `"${field}"`;
  }
  return field;
}

function getFrom(data) {
  const arr = [];
  if (data.db) {
    arr.push(convert(data.db));
    arr.push(data.rp);
  }
  arr.push(convert(data.measurement));
  return `from ${arr.join('.')}`;
}

function getQL(data) {
  validate(data, ['measurement']);
  const arr = [];
  arr.push(getFrom(data));

  const conditions = data.conditions.slice();
  const groups = data.groups;
  if (data.start) {
    conditions.push(getTimeCondition(data.start, '>='));
  }
  if (data.end) {
    conditions.push(getTimeCondition(data.end, '<='));
  }

  if (conditions.length) {
    arr.push(`where ${conditions.sort().join(' and ')}`);
  }

  if (groups && groups.length) {
    arr.push(`group by ${groups.sort().join(',')}`);

    if (util.isNumber(data.fill)) {
      arr.push(`fill(${data.fill})`);
    }
  }

  if (data.order) {
    arr.push(`order by time ${data.order}`);
  }

  if (data.limit) {
    arr.push(`limit ${data.limit}`);
  }

  if (data.slimit) {
    arr.push(`slimit ${data.slimit}`);
  }

  if (data.offset) {
    arr.push(`offset ${data.offset}`);
  }

  return arr.join(' ');
}

function showKeys(type, measurement) {
  let ql = `show ${type} keys`;
  if (measurement) {
    ql = `${ql} from "${measurement}"`;
  }
  return ql;
}


class QL {
  constructor(db) {
    const data = internal(this);
    data.fields = [];
    data.conditions = [];
    data.calculations = [];
    data.groups = [];
    data.rp = '"default"';
    data.db = db;
  }
  set RP(v) {
    internal(this).rp = v;
    return this;
  }

  get RP() {
    return internal(this).rp;
  }

  set measurement(v) {
    internal(this).measurement = v;
    return this;
  }

  get measurement() {
    return internal(this).measurement;
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

  set slimit(v) {
    internal(this).slimit = v;
    return this;
  }

  get slimit() {
    return internal(this).slimit;
  }

  set fill(v) {
    internal(this).fill = v;
    return this;
  }

  get fill() {
    return internal(this).fill;
  }

  set into(v) {
    internal(this).into = v;
    return this;
  }

  get into() {
    return internal(this).into;
  }

  set order(v) {
    internal(this).order = v;
    return this;
  }

  get order() {
    return internal(this).order;
  }

  set offset(v) {
    internal(this).offset = v;
    return this;
  }

  get offset() {
    return internal(this).offset;
  }

  addField() {
    const args = Array.from(arguments).map(convert);
    addToArray(internal(this).fields, args);
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

  removeAllCondition() {
    internal(this).conditions.length = 0;
    return this;
  }

  condition(k, v) {
    if (util.isObject(k)) {
      const target = k;
      for (const tmp in target) {
        if (target.hasOwnProperty(tmp)) {
          this.condition(tmp, target[tmp]);
        }
      }
      return this;
    }
    if (k && v) {
      let tmp = v;
      if (util.isString(v)) {
        tmp = `'${v}'`;
      }
      this.addCondition(`${convert(k)} = ${tmp}`);
    } else if (k) {
      this.addCondition(k);
    }
    return this;
  }

  tag(k, v) {
    return this.condition(k, v);
  }

  field(k, v) {
    return this.condition(k, v);
  }

  addCalculate(type, field) {
    if (type && field) {
      internal(this).calculations.push(`${type}(${field})`);
    }
    return this;
  }

  removeCalculate(type, field) {
    if (type && field) {
      const data = internal(this);
      data.calculations = removeFromArray(data.calculations, `${type}(${field})`);
    }
    return this;
  }

  removeAllCalculate() {
    internal(this).calculations.length = 0;
    return this;
  }

  addGroup() {
    const args = Array.from(arguments).map(convert);
    addToArray(internal(this).groups, args);
    return this;
  }

  removeGroup() {
    const args = Array.from(arguments).map(convert);
    const data = internal(this);
    data.groups = removeFromArray(data.groups, args);
    return this;
  }

  toSelect() {
    const data = internal(this);
    const arr = ['select'];
    const fields = data.fields;
    const calculations = data.calculations;

    if (calculations && calculations.length) {
      arr.push(calculations.sort().join(','));
    } else if (fields && fields.length) {
      arr.push(fields.sort().join(','));
    } else {
      arr.push('*');
    }

    if (data.into) {
      arr.push(`into ${convert(data.into)}`);
    }

    arr.push(getQL(data));

    return arr.join(' ');
  }

  static createDatabase(db) {
    return `create database "${db}"`;
  }

  static createDatabaseNotExists(db) {
    return `create database if not exists "${db}"`;
  }

  static dropDatabase(db) {
    return `drop database "${db}"`;
  }

  static showDatabases() {
    return 'show databases';
  }

  static showRetentionPolicies(db) {
    return `show retention policies on "${db}"`;
  }

  static showMeasurements() {
    return 'show measurements';
  }

  static showTagKeys(measurement) {
    return showKeys('tag', measurement);
  }

  static showFieldKeys(measurement) {
    return showKeys('field', measurement);
  }

  static showSeries(measurement) {
    let ql = 'show series';
    if (measurement) {
      ql = `${ql} from "${measurement}"`;
    }
    return ql;
  }

}

module.exports = QL;
