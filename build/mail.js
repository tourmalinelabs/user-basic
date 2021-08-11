"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Q = require('q');
var nodemailer = require('nodemailer');
module.exports = function (fig) {
    var transporter = nodemailer.createTransport(fig);
    var self = {};
    self.send = function (opt) {
        return Q.Promise(function (resolve, reject) {
            transporter.sendMail(opt, function (err, info) {
                return err ? reject(err) : resolve(info);
            });
        });
    };
    return self;
};
//# sourceMappingURL=mail.js.map