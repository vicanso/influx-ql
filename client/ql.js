'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var internal = require('./internal');
var util = require('util');

function validate(data, keys) {
  var notSetKeys = [];
  keys.forEach(function (key) {
    /* istanbul ignore if */
    if (!data[key]) {
      notSetKeys.push(key);
    }
  });
  /* istanbul ignore if */
  if (notSetKeys.length) {
    throw new Error(notSetKeys.join(',') + ' can not be null');
  }
}

function getTimeCondition(time, type) {
  var timeDesc = '';
  if (time.charAt(0) === '-') {
    timeDesc = 'now() - ' + time.substring(1);
  } else if (/\d{4}-\d{2}-\d{2}/.test(time)) {
    timeDesc = '\'' + time + '\'';
  } else {
    timeDesc = time;
  }
  return 'time ' + type + ' ' + timeDesc;
}

function addToArray(arr, args) {
  /* istanbul ignore else */
  if (args && args.length) {
    arr.push.apply(arr, args);
  }
}

function removeFromArray(arr, args) {
  return arr.filter(function (item) {
    return !~args.indexOf(item);
  });
}

function convert(field) {
  /* istanbul ignore else */
  if (/[\s-]/.test(field)) {
    return '"' + field + '"';
  }
  return field;
}

function getFrom(data) {
  var arr = [];
  if (data.db) {
    arr.push(convert(data.db));
    arr.push(convert(data.intoRP || data.rp));
  }
  arr.push(convert(data.measurement));
  return 'from ' + arr.join('.');
}

function getInto(data) {
  var arr = [];
  if (data.db) {
    arr.push(convert(data.db));
    arr.push(convert(data.rp));
  }
  arr.push(convert(data.into));
  return 'into ' + arr.join('.');
}

function getQL(data) {
  validate(data, ['measurement']);
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
    arr.push('where ' + conditions.sort().join(' and '));
  }

  if (groups && groups.length) {
    arr.push('group by ' + groups.sort().join(','));

    if (util.isNumber(data.fill)) {
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

  return arr.join(' ');
}

function showKeys(type, measurement) {
  var ql = 'show ' + type + ' keys';
  if (measurement) {
    ql = ql + ' from ' + convert(measurement);
  }
  return ql;
}

var QL = function () {
  function QL(db) {
    _classCallCheck(this, QL);

    var data = internal(this);
    data.fields = [];
    data.conditions = [];
    data.calculations = [];
    data.groups = [];
    data.rp = '"default"';
    data.db = db;
  }

  _createClass(QL, [{
    key: 'addField',

    // CQ END

    value: function addField() {
      var args = Array.from(arguments).map(convert);
      addToArray(internal(this).fields, args);
      return this;
    }
  }, {
    key: 'removeField',
    value: function removeField() {
      var data = internal(this);
      data.fields = removeFromArray(data.fields, Array.from(arguments));
      return this;
    }
  }, {
    key: 'addCondition',
    value: function addCondition() {
      addToArray(internal(this).conditions, Array.from(arguments));
      return this;
    }
  }, {
    key: 'removeCondition',
    value: function removeCondition() {
      var data = internal(this);
      data.conditions = removeFromArray(data.conditions, Array.from(arguments));
      return this;
    }
  }, {
    key: 'removeAllCondition',
    value: function removeAllCondition() {
      internal(this).conditions.length = 0;
      return this;
    }
  }, {
    key: 'condition',
    value: function condition(k, v) {
      var _this = this;

      if (util.isObject(k)) {
        var _ret = function () {
          var target = k;
          var keys = Object.keys(target);
          keys.forEach(function (key) {
            return _this.condition(key, target[key]);
          });
          return {
            v: _this
          };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      }
      if (k && v) {
        (function () {
          var key = convert(k);
          if (util.isArray(v)) {
            (function () {
              var arr = [];
              v.forEach(function (_v) {
                var tmp = _v;
                if (util.isString(tmp)) {
                  tmp = '\'' + tmp + '\'';
                }
                arr.push(key + ' = ' + tmp);
              });
              _this.addCondition('(' + arr.join(' or ') + ')');
            })();
          } else {
            var tmp = v;
            if (util.isString(tmp)) {
              tmp = '\'' + tmp + '\'';
            }
            _this.addCondition(key + ' = ' + tmp);
          }
        })();
      } else if (k) {
        this.addCondition(k);
      }
      return this;
    }
  }, {
    key: 'tag',
    value: function tag(k, v) {
      return this.condition(k, v);
    }
  }, {
    key: 'field',
    value: function field(k, v) {
      return this.condition(k, v);
    }
  }, {
    key: 'addCalculate',
    value: function addCalculate(type, field) {
      if (type && field) {
        internal(this).calculations.push(type + '(' + field + ')');
      }
      return this;
    }
  }, {
    key: 'removeCalculate',
    value: function removeCalculate(type, field) {
      if (type && field) {
        var data = internal(this);
        data.calculations = removeFromArray(data.calculations, type + '(' + field + ')');
      }
      return this;
    }
  }, {
    key: 'removeAllCalculate',
    value: function removeAllCalculate() {
      internal(this).calculations.length = 0;
      return this;
    }
  }, {
    key: 'addGroup',
    value: function addGroup() {
      var args = Array.from(arguments).map(convert);
      addToArray(internal(this).groups, args);
      return this;
    }
  }, {
    key: 'removeGroup',
    value: function removeGroup() {
      var args = Array.from(arguments).map(convert);
      var data = internal(this);
      data.groups = removeFromArray(data.groups, args);
      return this;
    }
  }, {
    key: 'toSelect',
    value: function toSelect() {
      var data = internal(this);
      var arr = ['select'];
      var fields = data.fields;
      var calculations = data.calculations;

      if (calculations && calculations.length) {
        arr.push(calculations.sort().join(','));
      } else if (fields && fields.length) {
        arr.push(fields.sort().join(','));
      } else {
        arr.push('*');
      }

      if (data.into) {
        arr.push(getInto(data));
      }

      arr.push(getQL(data));

      return arr.join(' ');
    }
  }, {
    key: 'toCQ',
    value: function toCQ() {
      var data = internal(this);
      var arr = ['create continuous query ' + convert(data.cqName) + ' on ' + convert(data.db)];

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
    key: 'database',
    set: function set(v) {
      internal(this).db = v;
      return this;
    },
    get: function get() {
      return internal(this).db;
    }
  }, {
    key: 'RP',
    set: function set(v) {
      internal(this).rp = v;
      return this;
    },
    get: function get() {
      return internal(this).rp;
    }
  }, {
    key: 'intoRP',
    set: function set(v) {
      internal(this).intoRP = v;
      return this;
    },
    get: function get() {
      return internal(this).intoRP;
    }
  }, {
    key: 'measurement',
    set: function set(v) {
      internal(this).measurement = v;
      return this;
    },
    get: function get() {
      return internal(this).measurement;
    }
  }, {
    key: 'start',
    set: function set(v) {
      internal(this).start = v;
      return this;
    },
    get: function get() {
      return internal(this).start;
    }
  }, {
    key: 'end',
    set: function set(v) {
      internal(this).end = v;
      return this;
    },
    get: function get() {
      return internal(this).end;
    }
  }, {
    key: 'limit',
    set: function set(v) {
      internal(this).limit = v;
      return this;
    },
    get: function get() {
      return internal(this).limit;
    }
  }, {
    key: 'slimit',
    set: function set(v) {
      internal(this).slimit = v;
      return this;
    },
    get: function get() {
      return internal(this).slimit;
    }
  }, {
    key: 'fill',
    set: function set(v) {
      internal(this).fill = v;
      return this;
    },
    get: function get() {
      return internal(this).fill;
    }
  }, {
    key: 'into',
    set: function set(v) {
      internal(this).into = v;
      return this;
    },
    get: function get() {
      return internal(this).into;
    }
  }, {
    key: 'order',
    set: function set(v) {
      internal(this).order = v;
      return this;
    },
    get: function get() {
      return internal(this).order;
    }
  }, {
    key: 'offset',
    set: function set(v) {
      internal(this).offset = v;
      return this;
    },
    get: function get() {
      return internal(this).offset;
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
        ql = ql + ' from ' + convert(measurement);
      }
      return ql;
    }
  }, {
    key: 'createRP',
    value: function createRP(name, database, duration, replication, isDefault) {
      if (!name || !database || !duration) {
        throw new Error('name, database and duration can not be null');
      }
      var defaultValue = isDefault || false;
      var rpl = replication || 1;
      if (replication && util.isBoolean(replication)) {
        defaultValue = replication;
        rpl = isDefault || 1;
      }
      var arr = ['create retention policy "' + name + '" on "' + database + '"'];
      arr.push('duration ' + duration + ' replication ' + rpl);
      if (defaultValue) {
        arr.push('default');
      }
      return arr.join(' ');
    }
  }]);

  return QL;
}();

module.exports = QL;