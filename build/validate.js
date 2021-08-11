"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require('underscore');
const Q = require('q');
const Validator = require('the_validator');
const ValidationError = require('./error');
module.exports = (rules, data) => {
    const errors = new Validator(rules, {
        strict: false,
    }).test(data);
    return _.isEmpty(errors)
        ? Q()
        : Q.reject(new ValidationError(400, {
            message: 'A validation error occurred',
            errors: errors,
        }));
};
//# sourceMappingURL=validate.js.map