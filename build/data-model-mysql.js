"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('underscore');
var createMySQLWrap = require('mysql-wrap-production');
module.exports = function (fig) {
    var self = {};
    var table = fig.table || 'user';
    var sql = createMySQLWrap(fig.connection);
    var parse = function (data) {
        return data &&
            (_.isArray(data)
                ? _.map(data, parse)
                : _.extend(data, {
                    isConfirmed: Boolean(data.isConfirmed),
                }));
    };
    self.findByField = function (field, value) {
        var q = {};
        q[field] = value;
        return sql.selectOne(table, q).then(parse);
    };
    self.setConfirmedByUsername = function (fig) {
        return sql.update(table, {
            isConfirmed: fig.isConfirmed,
        }, {
            username: fig.username,
        });
    };
    self.setPasswordByUsername = function (fig) {
        return sql.update(table, {
            password: fig.password,
        }, {
            username: fig.username,
        });
    };
    self.insert = function (fig) { return sql.insert(table, fig); };
    return self;
};
//# sourceMappingURL=data-model-mysql.js.map