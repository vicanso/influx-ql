'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var internal = require('./internal');

function isUndefined(value) {
  return value === undefined;
}

function isString(value) {
  return typeof value === 'string';
}

function isNil(value) {
  return value == null;
}

function isObject(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return value != null && (type === 'object' || type === 'function');
}

function isBoolean(value) {
  return value === true || value === false;
}

function isNumber(value) {
  return typeof value === 'number';
}

function getParam(args, is, defaultValue) {
  var result = void 0;
  args.forEach(function (v) {
    if (!isUndefined(result)) {
      return;
    }
    if (is(v)) {
      result = v;
    }
  });
  if (isUndefined(result)) {
    result = defaultValue;
  }
  return result;
}

function getTimeCondition(time, type) {
  var timeDesc = '';
  if (time.charAt(0) === '-') {
    timeDesc = 'now() - ' + time.substring(1);
  } else if (/[\s-]+/.test(time)) {
    timeDesc = '\'' + time + '\'';
  } else {
    timeDesc = time;
  }
  return 'time ' + type + ' ' + timeDesc;
}

function addToArray(arr, args) {
  /* istanbul ignore else */
  if (args && args.length) {
    /* eslint prefer-spread:0 */
    arr.push.apply(arr, args);
  }
}

function removeFromArray(arr, args) {
  return arr.filter(function (item) {
    return args.indexOf(item) === -1;
  });
}

function convert(field) {
  var f = field.toLowerCase();
  var digitReg = /^[0-9]/;
  var reg = /[^a-z0-9_]/;
  /* istanbul ignore else */
  if (digitReg.test(f) || reg.test(f)) {
    return '"' + field + '"';
  }
  return field;
}

function convertKey(key) {
  if (!isString(key)) {
    return key;
  }
  // key + x
  if (key.indexOf('+') !== -1) {
    return key;
  }
  return '"' + key + '"';
}

function isRegExp(value) {
  return value.length > 2 && value.charAt(0) === '/' && value.charAt(value.length - 1) === '/';
}

function isReference(value) {
  return value.length > 2 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"';
}

function convertConditionValue(value) {
  if (isString(value) && !isRegExp(value) && !isReference(value)) {
    return '\'' + value + '\'';
  }
  return value;
}

function convertGroupValue(value) {
  var reg = /time\([\S\s]+?\)/;
  if (value === '*' || value.match(reg)) {
    return value;
  }
  return '"' + value + '"';
}

function convertMeasurement(measurement) {
  if (measurement.charAt(0) === ':' || isRegExp(measurement)) {
    return measurement;
  }
  return '"' + measurement + '"';
}

function getRelation(args, defaultValue) {
  var result = '';
  args.forEach(function (arg) {
    if (!isString(arg)) {
      return;
    }
    var lowArg = arg.toLowerCase();
    if (lowArg === 'and' || lowArg === 'or') {
      result = lowArg;
    }
  });
  return result || defaultValue || 'and';
}

function getOperator(args, defaultValue) {
  var result = '';
  args.forEach(function (arg) {
    if (!isString(arg)) {
      return;
    }
    var lowArg = arg.toLowerCase();
    if (lowArg !== 'and' && lowArg !== 'or') {
      result = lowArg;
    }
  });
  return result || defaultValue || '=';
}

function getConditions(data, operator, relation) {
  if (isString(data)) {
    var reg = /\sand\s|\sor\s/i;
    if (reg.test(data)) {
      return '(' + data + ')';
    }
    return data;
  }
  var keys = Object.keys(data);
  var arr = keys.map(function (k) {
    var key = convertKey(k);
    var v = data[k];
    if (Array.isArray(v)) {
      var tmpArr = v.map(function (tmp) {
        return key + ' ' + operator + ' ' + convertConditionValue(tmp);
      });
      return '(' + tmpArr.join(' or ') + ')';
    }
    var value = convertConditionValue(v);
    return key + ' ' + operator + ' ' + value;
  });
  if (arr.length > 1) {
    var joinKey = ' ' + relation + ' ';
    return '(' + arr.join(joinKey) + ')';
  }
  return arr.join('');
}

function getFrom(data) {
  var arr = [];
  if (data.subQuery) {
    arr.push('(' + data.subQuery + ')');
  } else if (data.measurements && data.measurements.length) {
    for (var i = 0; i < data.measurements.length; i += 1) {
      var measurement = data.measurements[i];
      var from = [];
      if (data.db) {
        from.push('"' + data.db + '"');
        if (data.rp) {
          from.push('"' + data.rp + '"');
        }
      }
      if (!data.rp && data.db) {
        from.push('');
      }
      from.push(convertMeasurement(measurement));
      arr.push(from.join('.'));
    }
  } else if (data.db) {
    var _from = [];
    _from.push('"' + data.db + '"');
    if (data.rp) {
      _from.push('"' + data.rp + '"');
    }
    arr.push(_from.join('.'));
  }
  return 'from ' + arr.join(',');
}

function getInto(data) {
  var arr = [];
  if (data.intoDB) {
    arr.push('"' + data.intoDB + '"');
    if (data.intoRP) {
      arr.push('"' + data.intoRP + '"');
    } else {
      arr.push('');
    }
  }
  arr.push(convertMeasurement(data.into));
  return 'into ' + arr.join('.');
}

function getQL(data) {
  var arr = [];
  arr.push(getFrom(data));

  var conditions = data.conditions.slice();
  var groups = data.groups;
  if (data.start) {
    conditions.push(getTimeCondition(data.start, '>='));
  }
  if (data.end) {
    conditions.push(getTimeCondition(data.end, '<='));
  }

  if (conditions.length) {
    var joinKey = ' ' + data.relation + ' ';
    arr.push('where ' + conditions.sort().join(joinKey));
  }

  if (groups && groups.length) {
    arr.push('group by ' + groups.sort().map(convertGroupValue).join(','));

    if (!isNil(data.fill)) {
      arr.push('fill(' + data.fill + ')');
    }
  }

  if (data.order) {
    arr.push('order by time ' + data.order);
  }

  if (data.limit) {
    arr.push('limit ' + data.limit);
  }

  if (data.slimit) {
    arr.push('slimit ' + data.slimit);
  }

  if (data.offset) {
    arr.push('offset ' + data.offset);
  }

  if (data.soffset) {
    arr.push('soffset ' + data.soffset);
  }

  if (data.tz) {
    arr.push('tz(\'' + data.tz + '\')');
  }

  return arr.join(' ');
}

function showKeys(type, measurement) {
  var ql = 'show ' + type + ' keys';
  if (measurement) {
    ql = ql + ' from "' + measurement + '"';
  }
  return ql;
}

/**
 * Influx QL
 *
 * @example
 * const QL = require('influx-ql');
 * const ql = new QL('mydb');
 * ql.measurement = 'http';
 * ql.RP = 'two-weeks';
 * ql.addField('status', 'spdy', 'fetch time');
 * ql.start = '2016-01-01';
 * ql.end = '-3h';
 * ql.limit = 10;
 * ql.order = 'desc';
 * ql.offset = 10;
 * ql.tz = 'America/Chicago';
 * ql.addGroup('spdy');
 * ql.addGroup('time(30s)');
 * ql.condition('code', 400);
 * ql.condition('use', 30, '<=');
 * ql.fill = 0;
 * console.info(ql.toSelect());
 */

var QL = function () {
  function QL(db) {
    _classCallCheck(this, QL);

    var data = internal(this);
    data.db = db;
    data.relation = 'and';
    this.condition = this.where;
    this.clean();
    // set measurements to prevent null reference
    // measurements arent supposed to be cleared upon .clear()
    data.measurements = [];
  }

  /**
   * Set influx ql measurement
   * @param  {String} measurement - The measurement's name
   * @since 2.0.0
   * @deprecated
   * @example
   * const ql = new QL('mydb');
   * ql.measurement = 'http';
   * console.info(ql.toSelect());
   * // => select * from "mydb".."http"
   */


  _createClass(QL, [{
    key: 'addMeasurement',

    // CQ END

    /**
     * Add influx ql measurement
     * @param {String} measurement - measurement name
     * @return {QL}
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addFunction('count', 'use');
     * console.info(ql.toSelect());
     * // => select count("use") from "mydb".."http"
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addMeasurement('https');
     * ql.addFunction('count', 'use');
     * console.info(ql.toSelect());
     * // => select count("use") from "mydb".."http","mydb".."https"
     */
    value: function addMeasurement() {
      var args = Array.from(arguments);
      addToArray(internal(this).measurements, args);
      return this;
    }

    /**
     * Remove influx ql measurement
     * @param {String} measurement - measurement name
     * @return {QL}
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.addMeasurement('foo', 'bar');
     * ql.removeMeasurement('foo')
     * ql.addFunction('count', 'use');
     * console.info(ql.toSelect());
     * // => select count("use") from "mydb".."bar"
     */

  }, {
    key: 'removeMeasurement',
    value: function removeMeasurement() {
      var args = Array.from(arguments);
      var data = internal(this);
      data.measurements = removeFromArray(data.measurements, args);
      return this;
    }

    /**
     * Empty influx ql measurements
     * @return {QL}
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.addMeasurement('http', 'https');
     * ql.emptyMeasurements();
     * console.info(ql.toSelect());
     * // => select * from "mydb"
     */

  }, {
    key: 'emptyMeasurements',
    value: function emptyMeasurements() {
      var data = internal(this);
      data.measurements.length = 0;
      return this;
    }

    /**
     * Add the field of the query result
     * @param  {String} field - field's name
     * @return QL
     * @since 2.6.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addField('status', 'spdy', 'fetch time');
     * console.info(ql.toSelect());
     * // => select "fetch time","spdy","status" from "mydb".."http"
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addField({
     *   'fetch time': 'ft',
     * });
     * console.info(ql.toSelect());
     * // => select "fetch time" as "ft" from "mydb".."http"
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addField('"use" + 2');
     * console.info(ql.toSelect());
     * // => select "use" + 2 from "mydb".."http"
     */

  }, {
    key: 'addField',
    value: function addField() {
      var args = Array.from(arguments);
      addToArray(internal(this).fields, args);
      return this;
    }
    /**
     * Remove the field of the query result
     * @param  {String} field - field's name
     * @return QL
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addField('status', 'spdy', 'fetch time');
     * ql.removeField('status');
     * console.info(ql.toSelect());
     * // => select "fetch time","spdy" from "mydb".."http"
     */

  }, {
    key: 'removeField',
    value: function removeField() {
      var data = internal(this);
      var args = Array.from(arguments);
      data.fields = data.fields.filter(function (item) {
        if (isObject(item)) {
          var keys = Object.keys(item);
          keys.forEach(function (key) {
            if (args.indexOf(key) !== -1) {
              /* eslint no-param-reassign:0 */
              delete item[key];
            }
          });
          return true;
        }
        return args.indexOf(item) === -1;
      });
      return this;
    }

    /**
     * Remove all fields of the query result
     * @return QL
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addField('status', 'spdy', 'fetch time');
     * ql.emptyFields();
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http"
     */

  }, {
    key: 'emptyFields',
    value: function emptyFields() {
      var data = internal(this);
      data.fields.length = 0;
      return this;
    }

    /**
     * Add the influx ql where condition, alias for condition
     * @param  {String} key   - the condition key
     * @param  {String} value - the condition value
     * @param  {String} relation - the multi condition relation
     * @param  {String} operator - the conditon operator, default is '='
     * @return {QL}
     * @since 2.0.0
     * @example
     * const ql = new QL();
     * ql.measurement = 'http';
     * ql.where('code', 500);
     * console.info(ql.toSelect());
     * // => select * from "http" where "code" = 500
     * @example
     * const ql = new QL();
     * ql.measurement = 'http';
     * ql.where({
     *   code: 500,
     *   spdy: '1',
     * });
     * console.info(ql.toSelect());
     * // => select * from "http" where ("code" = 500 and "spdy" = '1')
     * @example
     * const ql = new QL();
     * ql.measurement = 'http';
     * ql.where('spdy', ['1', '2']);
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http" where ("spdy" = '1' or "spdy" = '2')
     * @example
     * const ql = new QL();
     * ql.measurement = 'http';
     * ql.where({
     *   code: 500,
     *   spdy: '1',
     * }, '!=');
     * console.info(ql.toSelect());
     * // => select * from "http" where ("code" != 500 and "spdy" != '1')
     * @example
     * const ql = new QL();
     * ql.measurement = 'http';
     * ql.where('code', /5\d{2}/);
     * console.info(ql.toSelect());
     * // => select * from "http" where "code" = /5\d{2}/
     */

  }, {
    key: 'where',
    value: function where(key, value, rlt, op) {
      var data = key;
      var args = [rlt, op];
      if (isObject(key)) {
        args = [value, rlt];
      } else if (!isNil(value)) {
        data = {};
        data[key] = value;
      }

      var relation = getRelation(args);
      var operator = getOperator(args);

      var condition = getConditions(data, operator, relation);
      if (condition) {
        addToArray(internal(this).conditions, [condition]);
      }
      return this;
    }

    /**
     * Empty the influx ql where condition
     * @return {QL}
     * @since 2.0.0
     * @example
     * const ql = new QL();
     * ql.measurement = 'http';
     * ql.condition({
     *   code: 500,
     *   spyd: '1',
     * });
     * console.info(ql.toSelect());
     * // => select * from "http" where ("code" = 500 and "spdy" = '1')
     * ql.emptyConditions();
     * console.info(ql.toSelect());
     * // => select * from "http"
     */

  }, {
    key: 'emptyConditions',
    value: function emptyConditions() {
      internal(this).conditions.length = 0;
      return this;
    }

    /**
     * Add influx ql function
     * @param {String} type  - function name
     * @param {Any} field - function param
     * @param {Any} field - function param
     * @param {Object} options - set the alias for the function, eg: {"alias": "the alias name"}
     * @return {QL}
     * @since 2.6.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addFunction('count', 'use');
     * ql.addFunction('mean', 'use');
     * ql.addGroup('spdy');
     * console.info(ql.toSelect());
     * // => select count("use"),mean("use") from "mydb".."http" group by "spdy"
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addFunction("bottom", 'use', 3);
     * console.info(ql.toSelect());
     * // => select bottom("use",3) from "mydb".."http"
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addFunction('count("use")');
     * console.info(ql.toSelect());
     * // => select count("use") from "mydb".."http"
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addFunction('count("use")', {
     *   alias: 'countUse',
     * });
     * console.info(ql.toSelect());
     * // => select count("use") as "countUse" from "mydb".."http"
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addFunction('count', 'use', {
     *   alias: 'countUse',
     * });
     * console.info(ql.toSelect());
     * // => select count("use") as "countUse" from "mydb".."http"
     */

  }, {
    key: 'addFunction',
    value: function addFunction() {
      var args = Array.from(arguments);
      var functions = internal(this).functions;
      var alias = null;
      if (isObject(args[args.length - 1])) {
        alias = args.pop().alias;
      }
      var fnDesc = '';
      if (args.length >= 2) {
        var type = args.shift();
        var arr = args.map(convertKey);
        fnDesc = type + '(' + arr.join(',') + ')';
      } else {
        fnDesc = args[0];
      }
      if (alias) {
        functions.push(fnDesc + ' as ' + convertKey(alias));
      } else {
        functions.push(fnDesc);
      }
      return this;
    }

    /**
     * Remove influx ql function
     * @param {String} type  - function name
     * @param {Any} field - function param
     * @param {Any} field - function param
     * @return {QL}
     * @since 2.6.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addFunction('count', 'use');
     * ql.addFunction('mean', 'use');
     * ql.removeFunction('count', 'use');
     * ql.addGroup('spdy');
     * ql.addGroup('time(6h)');
     * console.info(ql.toSelect());
     * // => select mean("use") from "mydb".."http" group by "spdy"
     */

  }, {
    key: 'removeFunction',
    value: function removeFunction() {
      var data = internal(this);
      var args = Array.from(arguments);
      var fnDesc = '';
      if (args.length >= 2) {
        var type = args.shift();
        var arr = args.map(convertKey);
        fnDesc = type + '(' + arr.join(',') + ')';
      } else {
        fnDesc = args[0];
      }
      data.functions = data.functions.filter(function (item) {
        if (item === fnDesc) {
          return false;
        }
        return item.indexOf(fnDesc + ' as ') === -1;
      });
      return this;
    }

    /**
     * Remove all influx ql functions
     * @return {QL}
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addFunction('count', 'use');
     * ql.addFunction('mean', 'use');
     * ql.emptyFunctions();
     * ql.addGroup('spdy');
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http" group by "spdy"
     */

  }, {
    key: 'emptyFunctions',
    value: function emptyFunctions() {
      internal(this).functions.length = 0;
      return this;
    }

    /**
     * Add influx ql group by
     * @param {String} tag - tag's name
     * @return {QL}
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addGroup('spdy', 'method');
     * ql.addFunction('count', 'use');
     * console.info(ql.toSelect());
     * // => select count("use") from "mydb".."http" group by "method","spdy"
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addGroup('spdy', 'time(1m)');
     * ql.addFunction('count', 'use');
     * console.info(ql.toSelect());
     * // => select count("use") from "mydb".."http" group by "method","time(1m)"
     */

  }, {
    key: 'addGroup',
    value: function addGroup() {
      var args = Array.from(arguments);
      addToArray(internal(this).groups, args);
      return this;
    }

    /**
     * Remove influx ql group by
     * @param {String} tag - tag's name
     * @return {QL}
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addGroup('spdy', 'method');
     * ql.removeGroup('spdy')
     * ql.addFunction('count', 'use');
     * console.info(ql.toSelect());
     * // => select count("use") from "mydb".."http" group by "method"
     */

  }, {
    key: 'removeGroup',
    value: function removeGroup() {
      var args = Array.from(arguments);
      var data = internal(this);
      data.groups = removeFromArray(data.groups, args);
      return this;
    }

    /**
     * Empty influx ql group by
     * @return {QL}
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addGroup('spdy', 'method');
     * ql.emptyGroups();
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http"
     */

  }, {
    key: 'emptyGroups',
    value: function emptyGroups() {
      var data = internal(this);
      data.groups.length = 0;
      return this;
    }

    /**
     * Get the influx select ql
     * @return {String}
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.RP = 'two-weeks';
     * ql.addField('status', 'spdy', 'fetch time');
     * ql.start = '2016-01-01';
     * ql.end = '-3h';
     * ql.limit = 10;
     * ql.order = 'desc';
     * ql.offset = 10;
     * ql.addGroup('spdy');
     * ql.condition('code', 400);
     * ql.condition('use', 30, '<=');
     * ql.fill = 0;
     * console.info(ql.toSelect());
     */

  }, {
    key: 'toSelect',
    value: function toSelect() {
      var data = internal(this);
      var arr = ['select'];
      var fields = data.fields;
      var functions = data.functions;
      var selectFields = [];
      if (functions && functions.length) {
        functions.forEach(function (item) {
          return selectFields.push(item);
        });
      }
      if (fields && fields.length) {
        var convertField = function convertField(field) {
          if (isObject(field)) {
            var tmpArr = [];
            var keys = Object.keys(field);
            keys.forEach(function (key) {
              var v = convertKey(key) + ' as ' + convertKey(field[key]);
              tmpArr.push(v);
            });
            return tmpArr;
          }
          return [convertKey(field)];
        };
        fields.map(convertField).forEach(function (items) {
          return selectFields.push.apply(selectFields, items);
        });
      }
      if (selectFields.length) {
        arr.push(selectFields.sort().join(','));
      } else {
        arr.push('*');
      }

      if (data.into) {
        arr.push(getInto(data));
      }

      arr.push(getQL(data));

      var str = arr.join(' ');
      if (data.multi) {
        return data.multi + ';' + str;
      }
      return str;
    }
    /**
     * Set the sub query string, it will get the current ql for sub query
     * and clean the query options
     * @since 2.5.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addFunction('max', 'fetch time');
     * ql.addGroup('spdy');
     * ql.subQuery();
     * ql.addFunction('sum', 'max');
     * console.info(ql.toSelect());
     * // => select sum("max") from (select max("fetch time") from "mydb".."http" group by "spdy")
     */

  }, {
    key: 'subQuery',
    value: function subQuery() {
      var data = internal(this);
      var subQuery = this.toSelect();
      this.clean();
      data.subQuery = subQuery;
      return this;
    }
    /**
     * Multi query
     * @since 2.7.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addFunction('max', 'fetch time');
     * ql.addGroup('spdy');
     * ql.multiQuery();
     * ql.addFunction('sum', 'max');
     * console.info(ql.toSelect());
     * // => select max("fetch time") from "mydb".."http" group by "spdy";
     * select sum("max") from "mydb".."http"
     */

  }, {
    key: 'multiQuery',
    value: function multiQuery() {
      var data = internal(this);
      var query = this.toSelect();
      this.clean();
      if (!data.multi) {
        data.multi = [];
      }
      data.multi = query;
      return this;
    }

    /**
     * Clean all the influx ql condition
     * @since 2.5.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addField('fetch time');
     * ql.addGroup('spdy');
     * ql.clean();
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http"
     */

  }, {
    key: 'clean',
    value: function clean() {
      var data = internal(this);
      data.fields = [];
      data.conditions = [];
      data.functions = [];
      data.groups = [];
      data.rp = '';
      data.intoRP = '';
      data.subQuery = '';
      data.start = '';
      data.end = '';
      data.limit = 0;
      data.slimit = 0;
      data.offset = 0;
      data.soffset = 0;
      data.tz = '';
      data.order = '';
      data.fill = null;
    }
  }, {
    key: 'toCQ',
    value: function toCQ() {
      var data = internal(this);
      var arr = ['create continuous query ' + convert(data.cqName) + ' on "' + data.db + '"'];

      if (data.cqEvery || data.cqFor) {
        arr.push('resample');
        if (data.cqEvery) {
          arr.push('every ' + data.cqEvery);
        }
        if (data.cqFor) {
          arr.push('for ' + data.cqFor);
        }
      }

      arr.push('begin ' + this.toSelect() + ' end');

      return arr.join(' ');
    }
  }, {
    key: 'measurement',
    set: function set(measurement) {
      internal(this).measurements = [measurement];
    }

    /**
     * Get influx ql measurement
     * @since 2.0.0
     * @deprecated
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * console.info(ql.measurement);
     * // => 'http'
     */
    ,
    get: function get() {
      return internal(this).measurements[0];
    }

    /**
     * Set the database for influx ql
     * @param {String} db - database's name
     * @since 2.0.0
     * @example
     * const ql = new QL();
     * ql.database = 'mydb';
     */

  }, {
    key: 'database',
    set: function set(v) {
      internal(this).db = v;
      return this;
    }

    /**
     * Get the database
     * @since 2.0.0
     * @example
     * console.info(ql.database);
     */
    ,
    get: function get() {
      return internal(this).db;
    }

    /**
     * Set the database for select into
     * @param {String} database - database's name
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.mearsurement = 'http';
     * ql.rp = 'my-rp';
     * ql.intoDatabase = 'mydb copy';
     * ql.into = 'http copy';
     * ql.intoRP = 'my-rp-copy';
     */

  }, {
    key: 'intoDatabase',
    set: function set(v) {
      internal(this).intoDB = v;
      return this;
    }

    /**
     * Get the database for select into
     * @since 2.0.0
     * @example
     * console.info(ql.intoDatabase);
     */
    ,
    get: function get() {
      return internal(this).intoDB;
    }

    /**
     * Set the measurement for select into
     * @param {String} measurement - measurement's name
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.mearsurement = 'http';
     * ql.rp = 'my-rp';
     * ql.intoDatabase = 'mydb copy';
     * ql.into = 'http copy';
     * ql.intoRP = 'my-rp-copy';
     */

  }, {
    key: 'into',
    set: function set(v) {
      internal(this).into = v;
      return this;
    }

    /**
     * Get the measurement for select into
     * @since 2.0.0
     * @example
     * console.info(ql.into);
     */
    ,
    get: function get() {
      return internal(this).into;
    }

    /**
     * Set influx ql retention policy
     * @param {String} rp - The reten retention policy
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.RP = 'two-weeks';
     * console.info(ql.toSelect());
     * // => select * from "mydb"."two-weeks"."http"
     */

  }, {
    key: 'RP',
    set: function set(rp) {
      internal(this).rp = rp;
    }
    /**
     * Get influx ql retention policy
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.RP = 'two-weeks';
     * console.info(ql.RP);
     * // => two-weeks
     */
    ,
    get: function get() {
      return internal(this).rp;
    }

    /**
     * Set the rp for select into
     * @param {String} rp - retention policy
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.rp = 'my-rp';
     * ql.intoDatabase = 'mydb copy';
     * ql.into = 'http copy';
     * ql.intoRP = 'my-rp-copy';
     */

  }, {
    key: 'intoRP',
    set: function set(v) {
      internal(this).intoRP = v;
      return this;
    }

    /**
     * Get the rp for select into
     * @since 2.0.0
     * @example
     * console.info(ql.intoRP);
     */
    ,
    get: function get() {
      return internal(this).intoRP;
    }

    /**
     * Set influx ql start time
     * @param  {String} start - start time
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.start = '-3h';
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http" where time >= now() - 3h
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.start = '2015-08-18T00:00:00Z';
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http" where time >= '2015-08-18T00:00:00Z'
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.start = '1388534400s;
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http" where time >= 1388534400s
     */

  }, {
    key: 'start',
    set: function set(start) {
      internal(this).start = start;
    }

    /**
     * Get influx ql start time
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.start = '-3h';
     * console.info(ql.start);
     * // => '-3h';
     */
    ,
    get: function get() {
      return internal(this).start;
    }

    /**
     * Set influx ql end time
     * @param  {String} end - end time
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.end = '-1h';
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http" where time <= now() - 1h
     */

  }, {
    key: 'end',
    set: function set(v) {
      internal(this).end = v;
    }

    /**
     * Get influx ql end time
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.end = '-1h';
     * console.info(ql.end);
     * // => '-1h';
     */
    ,
    get: function get() {
      return internal(this).end;
    }

    /**
     * Set influx ql query result point limit
     * @param  {Integer} limit - the result point limit
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.limit = 10;
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http" limit 10
     */

  }, {
    key: 'limit',
    set: function set(limit) {
      internal(this).limit = limit;
    }

    /**
     * Get influx ql query result point limit
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.limit = 10;
     * console.info(ql.limit);
     * // => 10
     */
    ,
    get: function get() {
      return internal(this).limit;
    }

    /**
     * Set influx query result series limit
     * @param  {Integer} slimit - the result series limit
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.slimit = 3;
     * console.info(ql.toSelect());
     * // => select * from "mydb" slimit 3
     */

  }, {
    key: 'slimit',
    set: function set(slimit) {
      internal(this).slimit = slimit;
      return this;
    }

    /**
     * Get influx query result series limit
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.slimit = 3;
     * console.info(ql.slimit);
     * // => 3
     */
    ,
    get: function get() {
      return internal(this).slimit;
    }

    /**
     * Set the influx query result fill value for time intervals that have no data
     * @param  {String | Number} fill - fill value, special value: linear none null previous.
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addGroup('spdy');
     * ql.fill = 0;
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http" group by "spdy" fill(0)
     */

  }, {
    key: 'fill',
    set: function set(fill) {
      internal(this).fill = fill;
    }

    /**
     * Get the influx query result fill value for time intervals that have no data
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addGroup('spdy');
     * ql.fill = 0;
     * console.info(ql.fill);
     * // => 0
     */
    ,
    get: function get() {
      return internal(this).fill;
    }
    /**
     * Set the influx query result order of time
     * @param  {String} order - 'desc' or 'asc'
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addGroup('spdy');
     * ql.order = 'desc';
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http" group by "spdy" order by time desc
     */

  }, {
    key: 'order',
    set: function set(order) {
      internal(this).order = order;
    }

    /**
     * Get the influx query result order of time
     * @param  {String} order - 'desc' or 'asc'
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.addGroup('spdy');
     * console.info(ql.order);
     * // => undefined
     * ql.order = 'desc';
     * // => 'desc'
     */
    ,
    get: function get() {
      return internal(this).order;
    }

    /**
     * Set influx ql query offset of the result
     * @param  {Integer} offset - offset value
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * ql.offset = 10;
     * console.info(ql.toSelect());
     * // => select * from "mydb".."http" offset 10
     */

  }, {
    key: 'offset',
    set: function set(v) {
      internal(this).offset = v;
    }

    /**
     * Get influx ql query offset of the result
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.measurement = 'http';
     * console.info(ql.offset);
     * // => 0
     * ql.offset = 10;
     * console.info(ql.offset);
     * // => 10
     */
    ,
    get: function get() {
      return internal(this).offset || 0;
    }

    /**
     * Set influx ql offset series in the query results
     * @param  {Integer} soffset - soffset value
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * ql.soffset = 10;
     * console.info(ql.toSelect());
     * // => select * from "mydb" soffset 10
     */

  }, {
    key: 'soffset',
    set: function set(soffset) {
      internal(this).soffset = soffset;
    }

    /**
     * Get influx ql offset series in the query results
     * @return {Integer}
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * console.info(ql.soffset);
     * // => 0
     * ql.soffset = 10;
     * console.info(ql.soffset);
     * // => 10
     */
    ,
    get: function get() {
      return internal(this).soffset || 0;
    }

    /**
     * Get influx ql default where relation
     * @return {String}
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * console.info(ql.relation);
     * // => 'and'
     */

  }, {
    key: 'relation',
    get: function get() {
      return internal(this).relation;
    }

    /**
     * Set influx ql default where relation
     * @param  {String} relation - the default relation
     * @since 2.0.0
     * @example
     * const ql = new QL('mydb');
     * console.info(ql.relation);
     * // => and
     * ql.relation = 'or';
     * console.info(ql.relation);
     * // => or
     */
    ,
    set: function set(relation) {
      internal(this).relation = relation;
    }

    /**
     * Set influx ql time zone
     * @param  {String} tz - time zone
     * @since 2.9.0
     * @example
     * const ql = new QL('mydb');
     * ql.tz = 'America/Chicago';
     * console.info(ql.tz);
     * // => America/Chicago
     */

  }, {
    key: 'tz',
    set: function set(v) {
      internal(this).tz = v;
    }

    /**
    * Get influx ql time zone
    * @return {String}
    * @since 2.9.0
    * @example
    * const ql = new QL('mydb');
    * ql.tz = 'America/Chicago'
    * console.info(ql.tz);
    * // => 'America/Chicago'
    */
    ,
    get: function get() {
      return internal(this).tz;
    }

    // CQ BEGIN

  }, {
    key: 'cqName',
    set: function set(v) {
      internal(this).cqName = v;
      return this;
    },
    get: function get() {
      return internal(this).cqName;
    }
  }, {
    key: 'cqEvery',
    set: function set(v) {
      internal(this).cqEvery = v;
      return this;
    },
    get: function get() {
      return internal(this).cqEvery;
    }
  }, {
    key: 'cqFor',
    set: function set(v) {
      internal(this).cqFor = v;
      return this;
    },
    get: function get() {
      return internal(this).cqFor;
    }
  }], [{
    key: 'createDatabase',
    value: function createDatabase(db) {
      return 'create database ' + convert(db);
    }
  }, {
    key: 'createDatabaseNotExists',
    value: function createDatabaseNotExists(db) {
      return 'create database if not exists ' + convert(db);
    }
  }, {
    key: 'dropDatabase',
    value: function dropDatabase(db) {
      return 'drop database ' + convert(db);
    }
  }, {
    key: 'showDatabases',
    value: function showDatabases() {
      return 'show databases';
    }
  }, {
    key: 'showRetentionPolicies',
    value: function showRetentionPolicies(db) {
      return 'show retention policies on ' + convert(db);
    }
  }, {
    key: 'showMeasurements',
    value: function showMeasurements() {
      return 'show measurements';
    }
  }, {
    key: 'showTagKeys',
    value: function showTagKeys(measurement) {
      return showKeys('tag', measurement);
    }
  }, {
    key: 'showFieldKeys',
    value: function showFieldKeys(measurement) {
      return showKeys('field', measurement);
    }
  }, {
    key: 'showSeries',
    value: function showSeries(measurement) {
      var ql = 'show series';
      if (measurement) {
        ql = ql + ' from "' + measurement + '"';
      }
      return ql;
    }
  }, {
    key: 'createRP',
    value: function createRP(name, database, duration, replication, shardDuration, isDefault) {
      if (!name || !database || !duration) {
        throw new Error('name, database and duration can not be null');
      }
      var args = [replication, shardDuration, isDefault];
      var defaultValue = getParam(args, isBoolean);
      var rpl = getParam(args, isNumber, 1);
      var shdDuration = getParam(args, isString);
      var arr = ['create retention policy "' + name + '" on "' + database + '"'];
      if (duration) {
        arr.push('duration ' + duration);
      }
      if (rpl) {
        arr.push('replication ' + rpl);
      }
      if (shdDuration) {
        arr.push('shard duration ' + shdDuration);
      }
      if (defaultValue) {
        arr.push('default');
      }
      return arr.join(' ');
    }
  }, {
    key: 'dropRP',
    value: function dropRP(name, database) {
      return 'drop retention policy "' + name + '" on "' + database + '"';
    }
  }, {
    key: 'updateRP',
    value: function updateRP(name, database, duration, replication, shardDuration, isDefault) {
      if (!name || !database) {
        throw new Error('name and database can not be null');
      }
      var args = [replication, shardDuration, isDefault];
      var defaultValue = getParam(args, isBoolean);
      var rpl = getParam(args, isNumber);
      var shdDuration = getParam(args, isString);
      var arr = ['alter retention policy "' + name + '" on "' + database + '"'];
      if (duration && duration !== '0') {
        arr.push('duration ' + duration);
      }
      if (rpl) {
        arr.push('replication ' + rpl);
      }
      if (shdDuration) {
        arr.push('shard duration ' + shdDuration);
      }
      if (defaultValue) {
        arr.push('default');
      }
      return arr.join(' ');
    }
  }]);

  return QL;
}();

module.exports = QL;