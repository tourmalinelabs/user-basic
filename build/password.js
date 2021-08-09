"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Q = require('q');
var bcrypt = require('bcrypt');
exports.compare = function (plainText, hashed) { return Q.promise(function (resolve, reject) {
    bcrypt.compare(plainText, hashed, function (err, isValid) { return err ? reject(err) : resolve(isValid); });
}); };
exports.hash = function (password) { return Q.promise(function (resolve, reject) {
    bcrypt.genSalt(10, function (err, salt) { return err ? reject(err) : bcrypt.hash(password, salt, function (err, hash) { return err ? reject(err) : resolve(hash); }); });
}); };
//# sourceMappingURL=password.js.map