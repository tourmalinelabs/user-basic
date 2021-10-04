"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = __importDefault(require("./model"));
const data_model_mysql_1 = __importDefault(require("./data-model-mysql"));
const notification_model_email_1 = __importDefault(require("./notification-model-email"));
const _exports = {};
_exports.model = model_1.default;
_exports.dataModelMysql = data_model_mysql_1.default;
_exports.notificationModelEMail = notification_model_email_1.default;
module.exports = _exports;
exports.default = _exports;
//# sourceMappingURL=index.js.map