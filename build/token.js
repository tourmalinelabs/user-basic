"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('underscore');
var Q = require('q');
var jwt = require('jsonwebtoken');
var validate = require('./validate');
exports.create = function (fig) { return validate({
    password: ['required', 'type:string'],
    expiresInSeconds: ['type:number'],
    content: ['any']
}, fig).then(function () { return jwt.sign(fig.content, fig.password, _.extend(_.omit(fig, 'content', 'password', 'expiresInSeconds'), {
    algorithm: 'HS256',
    expiresIn: fig.expiresInSeconds
})); }); };
exports.decode = function (fig) { return validate({
    password: ['required', 'type:string'],
    token: ['required', 'type:string']
}, fig).then(function () { return Q.Promise(function (resolve, reject) { return jwt.verify(fig.token, fig.password, {
    algorithms: ['HS256']
}, function (err, decoded) {
    if (err) {
        reject(err);
    }
    else if (!decoded) {
        reject(new Error('Token is empty'));
    }
    else {
        resolve(decoded);
    }
}); }); }).then(function (decoded) { return _.omit(decoded, 'iat', 'exp'); }); };
//# sourceMappingURL=token.js.map