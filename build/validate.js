"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const underscore_1 = __importDefault(require("underscore"));
const q_1 = __importDefault(require("q"));
const the_validator_1 = __importDefault(require("the_validator"));
const error_1 = __importDefault(require("./error"));
const fn = (rules, data) => {
    const errors = new the_validator_1.default(rules, {
        strict: false,
    }).test(data);
    return underscore_1.default.isEmpty(errors)
        ? (0, q_1.default)()
        : q_1.default.reject(new error_1.default(400, {
            message: 'A validation error occurred',
            errors: errors,
        }));
};
module.exports = fn;
exports.default = fn;
//# sourceMappingURL=validate.js.map