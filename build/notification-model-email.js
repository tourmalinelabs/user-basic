"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const q_1 = __importDefault(require("q"));
const mail_1 = __importDefault(require("./mail"));
const fn = (fig) => {
    const self = {};
    const mail = (0, mail_1.default)(fig.smtp);
    const from = fig.from;
    const getToField = fig.getToField;
    const subjectTemplate = fig.subjectTemplate;
    const bodyTemplate = fig.bodyTemplate;
    self.send = (fig) => q_1.default.all([getToField(fig), subjectTemplate(fig), bodyTemplate(fig)]).then((resp) => mail.send({
        from: from,
        to: resp[0],
        subject: resp[1],
        html: resp[2]
    }));
    return self;
};
module.exports = fn;
exports.default = fn;
//# sourceMappingURL=notification-model-email.js.map