"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const underscore_1 = __importDefault(require("underscore"));
const mysql_wrap_production_1 = __importDefault(require("mysql-wrap-production"));
const fn = (fig) => {
    const self = {};
    const table = fig.table || "user";
    const sql = (0, mysql_wrap_production_1.default)(fig.connection);
    const parse = (data) => data &&
        (underscore_1.default.isArray(data)
            ? underscore_1.default.map(data, parse)
            : underscore_1.default.extend(data, {
                isConfirmed: Boolean(data.isConfirmed)
            }));
    self.findByField = (field, value) => {
        const q = {};
        q[field] = value;
        return sql.selectOne(table, q).then(parse);
    };
    self.setConfirmedByUsername = (fig) => sql.update(table, {
        isConfirmed: fig.isConfirmed
    }, {
        username: fig.username
    });
    self.setPasswordByUsername = (fig) => sql.update(table, {
        password: fig.password
    }, {
        username: fig.username
    });
    self.insert = (fig) => sql.insert(table, fig);
    return self;
};
module.exports = fn;
exports.default = fn;
//# sourceMappingURL=data-model-mysql.js.map