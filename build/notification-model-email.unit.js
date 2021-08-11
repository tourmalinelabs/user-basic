"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Q = require('q');
var chai = require('chai');
var config = require('../test-config');
var notificationModel = require('./notification-model-email')({
    from: config.smtp.auth.user,
    smtp: config.smtp,
    getToField: function (fig) { return Q(fig.user.to); },
    bodyTemplate: function (fig) {
        return Q('<h1>Hello</h1><pre>' + JSON.stringify(fig, null, 2) + '</pre>');
    },
    subjectTemplate: function (fig) { return Q('user-basic: ' + fig.user.foo); },
});
describe('notificatModelEmail', function () {
    describe('send', function () {
        it('should send an email', function (done) {
            notificationModel
                .send({
                token: 'token',
                user: {
                    foo: 'bar',
                    to: config.mailTo,
                },
            })
                .then(function () { return done(); })
                .done();
        });
    });
});
//# sourceMappingURL=notification-model-email.unit.js.map