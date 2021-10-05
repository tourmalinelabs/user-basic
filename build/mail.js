"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const q_1 = __importDefault(require("q"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const fn = (fig) => {
    const transporter = nodemailer_1.default.createTransport(fig);
    const self = {};
    self.send = (opt) => q_1.default.Promise((resolve, reject) => {
        transporter.sendMail(opt, (err, info) => (err ? reject(err) : resolve(info)));
    });
    return self;
};
module.exports = fn;
exports.default = fn;
//# sourceMappingURL=mail.js.map