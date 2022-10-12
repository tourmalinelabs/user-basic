"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const q_1 = __importDefault(require("q"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const _exports = {};
_exports.compare = (plainText, hashed) => q_1.default.promise((resolve, reject) => {
    bcryptjs_1.default.compare(plainText, hashed, (err, isValid) => err ? reject(err) : resolve(isValid));
});
_exports.hash = password => q_1.default.promise((resolve, reject) => {
    bcryptjs_1.default.genSalt(10, (err, salt) => err
        ? reject(err)
        : bcryptjs_1.default.hash(password, salt, (err, hash) => err ? reject(err) : resolve(hash)));
});
module.exports = _exports;
exports.default = _exports;
//# sourceMappingURL=password.js.map