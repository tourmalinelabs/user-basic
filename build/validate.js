"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('underscore');
var Q = require('q');
var Validator = require('the_validator');
var ValidationError = require('./error');
module.exports = function (rules, data) {
    var errors = new Validator(rules, {
        strict: false
    }).test(data);
    return _.isEmpty(errors) ? Q() : Q.reject(new ValidationError(400, {
        message: 'A validation error occurred',
        errors: errors
    }));
};
//# sourceMappingURL=validate.js.map