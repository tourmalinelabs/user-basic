"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require('q');
const chai = require('chai');
const config = require('../test-config');
const notificationModel = require('./notification-model-email')({
    from: config.smtp.auth.user,
    smtp: config.smtp,
    getToField: fig => Q(fig.user.to),
    bodyTemplate: fig => Q('<h1>Hello</h1><pre>' + JSON.stringify(fig, null, 2) + '</pre>'),
    subjectTemplate: fig => Q('user-basic: ' + fig.user.foo),
});
describe('notificatModelEmail', () => {
    describe('send', () => {
        it('should send an email', done => {
            notificationModel
                .send({
                token: 'token',
                user: {
                    foo: 'bar',
                    to: config.mailTo,
                },
            })
                .then(() => done())
                .done();
        });
    });
});
//# sourceMappingURL=notification-model-email.unit.js.map