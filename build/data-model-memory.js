"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('underscore');
var Q = require('q');
module.exports = function () {
    var self = {};
    var data = [];
    self.findByField = function (field, value) {
        var q = {};
        q[field] = value;
        return Q(_.findWhere(data, q));
    };
    self.insert = function (fig) {
        data.push(fig);
        return Q();
    };
    self.clearData = function () {
        data = [];
    };
    var setFieldByUsername = function (fig) {
        for (var i = 0; i < data.length; i += 1) {
            if (data[i].username === fig.username) {
                data[i][fig.field] = fig[fig.field];
            }
        }
        return Q();
    };
    self.setConfirmedByUsername = function (fig) { return setFieldByUsername(_.extend(_.clone(fig), {
        field: 'isConfirmed'
    })); };
    self.setPasswordByUsername = function (fig) { return setFieldByUsername(_.extend(_.clone(fig), {
        field: 'password'
    })); };
    return self;
};
//# sourceMappingURL=data-model-memory.js.map