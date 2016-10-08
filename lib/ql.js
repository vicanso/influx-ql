'use strict';

const internal = require('./internal');
const util = require('util');

function validate(data, keys) {
  const notSetKeys = [];
  keys.forEach((key) => {
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
    /* eslint prefer-spread:0 */
    arr.push.apply(arr, args);
  }
}

function removeFromArray(arr, args) {
  return arr.filter(item => args.indexOf(item) === -1);
}

function convert(field) {
  const f = field.toLowerCase();
  const digitReg = /^[0-9]/;
  const reg = /[^a-z0-9_]/;
  /* istanbul ignore else */
  if (digitReg.test(f) || reg.test(f)) {
    return `"${field}"`;
  }
  return field;
}

function convertField(field) {
  // field + x
  if (field.indexOf('+') !== -1) {
    return field;
  }
  return `"${field}"`;
}

function convertConditionKey(key) {
  // key + x
  if (key.indexOf('+') !== -1) {
    return key;
  }
  return `"${key}"`;
}

function isRegExp(value) {
  return (value.charAt(0) === '/' && value.charAt(value.length - 1) === '/');
}

function convertConditionValue(value) {
  if (util.isString(value) && !isRegExp(value)) {
    return `'${value}'`;
  }
  return value;
}

function convertGroupValue(value) {
  const reg = /time\(\S+\)/;
  if (value === '*' || value.match(reg)) {
    return value;
  }
  return `"${value}"`;
}

function convertMeasurement(measurement) {
  if (measurement.charAt(0) === ':' || isRegExp(measurement)) {
    return measurement;
  }
  return `"${measurement}"`;
}

function getFrom(data) {
  const arr = [];
  if (data.db) {
    arr.push(`"${data.db}"`);
    arr.push(`"${data.rp}"`);
  }
  arr.push(convertMeasurement(data.measurement));
  return `from ${arr.join('.')}`;
}

function getInto(data) {
  const arr = [];
  if (data.intoDB) {
    arr.push(`"${data.intoDB}"`);
    arr.push(`"${data.intoRP}"`);
  }
  arr.push(convertMeasurement(data.into));
  return `into ${arr.join('.')}`;
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
    arr.push(`group by ${groups.sort().map(convertGroupValue).join(',')}`);

    if (!util.isNullOrUndefined(data.fill)) {
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

  if (data.soffset) {
    arr.push(`soffset ${data.soffset}`);
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
    data.rp = 'default';
    data.intoRP = 'default';
    data.db = db;
  }

  set database(v) {
    internal(this).db = v;
    return this;
  }

  get database() {
    return internal(this).db;
  }

  set intoDatabase(v) {
    internal(this).intoDB = v;
    return this;
  }

  get intoDatabase() {
    return internal(this).intoDB;
  }

  set RP(v) {
    internal(this).rp = v;
    return this;
  }

  get RP() {
    return internal(this).rp;
  }

  set intoRP(v) {
    internal(this).intoRP = v;
    return this;
  }

  get intoRP() {
    return internal(this).intoRP;
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

  set soffset(v) {
    internal(this).soffset = v;
    return this;
  }

  get soffset() {
    return internal(this).soffset;
  }

  // CQ BEGIN
  set cqName(v) {
    internal(this).cqName = v;
    return this;
  }

  get cqName() {
    return internal(this).cqName;
  }

  set cqEvery(v) {
    internal(this).cqEvery = v;
    return this;
  }

  get cqEvery() {
    return internal(this).cqEvery;
  }

  set cqFor(v) {
    internal(this).cqFor = v;
    return this;
  }

  get cqFor() {
    return internal(this).cqFor;
  }
  // CQ END

  addField() {
    const args = Array.from(arguments);
    addToArray(internal(this).fields, args);
    return this;
  }

  removeField() {
    const data = internal(this);
    data.fields = removeFromArray(data.fields, Array.from(arguments));
    return this;
  }

  removeAllField() {
    const data = internal(this);
    data.fields.length = 0;
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

  condition(k, v, op) {
    const operator = op || '=';
    if (util.isObject(k)) {
      const target = k;
      const keys = Object.keys(target);
      keys.forEach(key => this.condition(key, target[key]));
      return this;
    }
    if (k && v) {
      const key = convertConditionKey(k);
      if (util.isArray(v)) {
        const arr = [];
        v.forEach((_v) => {
          const tmp = convertConditionValue(_v);
          arr.push(`${key} ${operator} ${tmp}`);
        });
        this.addCondition(`(${arr.join(' or ')})`);
      } else {
        const tmp = convertConditionValue(v);
        this.addCondition(`${key} ${operator} ${tmp}`);
      }
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
      internal(this).calculations.push(`${type}(${convertField(field)})`);
    }
    return this;
  }

  removeCalculate(type, field) {
    if (type && field) {
      const data = internal(this);
      data.calculations = removeFromArray(data.calculations, `${type}(${convertField(field)})`);
    }
    return this;
  }

  removeAllCalculate() {
    internal(this).calculations.length = 0;
    return this;
  }

  addGroup() {
    const args = Array.from(arguments);
    addToArray(internal(this).groups, args);
    return this;
  }

  removeGroup() {
    const args = Array.from(arguments);
    const data = internal(this);
    data.groups = removeFromArray(data.groups, args);
    return this;
  }

  removeAllGroup() {
    const data = internal(this);
    data.groups.length = 0;
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
      arr.push(fields.sort().map(convertField).join(','));
    } else {
      arr.push('*');
    }

    if (data.into) {
      arr.push(getInto(data));
    }

    arr.push(getQL(data));

    return arr.join(' ');
  }

  toCQ() {
    const data = internal(this);
    const arr = [`create continuous query ${convert(data.cqName)} on "${data.db}"`];

    if (data.cqEvery || data.cqFor) {
      arr.push('resample');
      if (data.cqEvery) {
        arr.push(`every ${data.cqEvery}`);
      }
      if (data.cqFor) {
        arr.push(`for ${data.cqFor}`);
      }
    }

    arr.push(`begin ${this.toSelect()} end`);

    return arr.join(' ');
  }

  static createDatabase(db) {
    return `create database ${convert(db)}`;
  }

  static createDatabaseNotExists(db) {
    return `create database if not exists ${convert(db)}`;
  }

  static dropDatabase(db) {
    return `drop database ${convert(db)}`;
  }

  static showDatabases() {
    return 'show databases';
  }

  static showRetentionPolicies(db) {
    return `show retention policies on ${convert(db)}`;
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

  static createRP(name, database, duration, replication, isDefault) {
    if (!name || !database || !duration) {
      throw new Error('name, database and duration can not be null');
    }
    let defaultValue = isDefault || false;
    let rpl = replication || 1;
    if (replication && util.isBoolean(replication)) {
      defaultValue = replication;
      rpl = isDefault || 1;
    }
    const arr = [`create retention policy "${name}" on "${database}"`];
    arr.push(`duration ${duration} replication ${rpl}`);
    if (defaultValue) {
      arr.push('default');
    }
    return arr.join(' ');
  }
}

module.exports = QL;
