"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const underscore_1 = __importDefault(require("underscore"));
const q_1 = __importDefault(require("q"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validate_1 = __importDefault(require("./validate"));
const _exports = {};
_exports.create = (fig) => (0, validate_1.default)({
    password: ["required", "type:string"],
    expiresInSeconds: ["type:number"],
    content: ["any"]
}, fig).then(() => jsonwebtoken_1.default.sign(fig.content, fig.password, underscore_1.default.extend(underscore_1.default.omit(fig, "content", "password", "expiresInSeconds"), {
    algorithm: "HS256",
    expiresIn: fig.expiresInSeconds
})));
_exports.decode = (fig) => (0, validate_1.default)({
    password: ["required", "type:string"],
    token: ["required", "type:string"]
}, fig)
    .then(() => q_1.default.Promise((resolve, reject) => jsonwebtoken_1.default.verify(fig.token, fig.password, {
    algorithms: ["HS256"]
}, (err, decoded) => {
    if (err) {
        reject(err);
    }
    else if (!decoded) {
        reject(new Error("Token is empty"));
    }
    else {
        resolve(decoded);
    }
})))
    .then((decoded) => underscore_1.default.omit(decoded, "iat", "exp"));
module.exports = _exports;
exports.default = _exports;
//# sourceMappingURL=token.js.map