"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('underscore');
var Q = require('q');
var createMail = require('./mail');
module.exports = function (fig) {
    var self = {};
    var mail = createMail(fig.smtp);
    var from = fig.from;
    var getToField = fig.getToField;
    var subjectTemplate = fig.subjectTemplate;
    var bodyTemplate = fig.bodyTemplate;
    self.send = function (fig) {
        return Q.all([getToField(fig), subjectTemplate(fig), bodyTemplate(fig)]).then(function (resp) {
            return mail.send({
                from: from,
                to: resp[0],
                subject: resp[1],
                html: resp[2],
            });
        });
    };
    return self;
};
//# sourceMappingURL=notification-model-email.js.map