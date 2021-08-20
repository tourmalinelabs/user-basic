"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require('underscore');
const Q = require('q');
const createMail = require('./mail');
module.exports = fig => {
    const self = {};
    const mail = createMail(fig.smtp);
    const from = fig.from;
    const getToField = fig.getToField;
    const subjectTemplate = fig.subjectTemplate;
    const bodyTemplate = fig.bodyTemplate;
    self.send = fig => Q.all([getToField(fig), subjectTemplate(fig), bodyTemplate(fig)]).then(resp => mail.send({
        from: from,
        to: resp[0],
        subject: resp[1],
        html: resp[2],
    }));
    return self;
};
//# sourceMappingURL=notification-model-email.js.map