"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const underscore_1 = __importDefault(require("underscore"));
const q_1 = __importDefault(require("q"));
const error_1 = __importDefault(require("./error"));
const validate_1 = __importDefault(require("./validate"));
const password_1 = __importDefault(require("./password"));
const token_1 = __importDefault(require("./token"));
const fn = (fig) => {
    const self = {};
    const dataModel = fig.dataModel;
    const confirmationModel = fig.confirmationModel;
    const passwordResetModel = fig.passwordResetModel;
    const tokenSecret = fig.tokenSecret;
    const loginExpirationSeconds = fig.loginExpirationSeconds || 60 * 60;
    const passwordResetExpirationSeconds = fig.passwordResetExpirationSeconds || 60 * 5;
    const confirmationExpirationSeconds = fig.confirmationExpirationSeconds || 60 * 60 * 24;
    const emailField = fig.emailField;
    const usernameField = fig.usernameField || "username";
    const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);
    const schema = () => {
        const s = {
            password: ["required", "type:string"]
        };
        s[usernameField] = ["required", "type:string"];
        if (emailField) {
            s[emailField] = ["required", "type:string", "email"];
        }
        return s;
    };
    self.register = (fig) => (0, validate_1.default)(schema(), fig)
        .then(() => dataModel.findByField(usernameField, fig.username))
        .then((userData) => userData &&
        q_1.default.reject(new error_1.default(400, {
            message: `The supplied ${usernameField} has already been taken`
        })))
        .then(() => emailField && emailField !== usernameField
        ? dataModel.findByField(emailField, fig[emailField]).then((userData) => userData &&
            q_1.default.reject(new error_1.default(400, {
                message: "The supplied " + emailField + " has already been taken"
            })))
        : (0, q_1.default)())
        .then(() => password_1.default.hash(fig.password))
        .then((hashedPassword) => dataModel.insert(underscore_1.default.extend(underscore_1.default.clone(fig), {
        password: hashedPassword,
        isConfirmed: false
    })));
    self.login = (fig) => {
        const loginError = new error_1.default(400, {
            message: `Invalid ${usernameField} or password`
        });
        const validateFig = {
            password: ["required", "type:string"]
        };
        const usernameOrEmailField = emailField ? `${usernameField}Or${capitalize(emailField)}` : usernameField;
        validateFig[usernameOrEmailField] = ["required", "type:string"];
        return (0, validate_1.default)(validateFig, fig)
            .then(() => dataModel.findByField(usernameField, fig[usernameOrEmailField]))
            .then((userData) => !userData && emailField && emailField !== usernameField
            ? dataModel.findByField(emailField, fig[usernameOrEmailField])
            : userData)
            .then((userData) => userData || q_1.default.reject(loginError))
            .then((userData) => {
            return password_1.default
                .compare(fig.password, userData.password)
                .then((isMatch) => isMatch || q_1.default.reject(loginError))
                .then(() => {
                const content = {
                    type: "login"
                };
                content[usernameField] = userData[usernameField];
                return token_1.default.create({
                    password: tokenSecret,
                    expiresInSeconds: loginExpirationSeconds,
                    content: content
                });
            });
        });
    };
    self.validateLoginToken = (tokenString) => token_1.default
        .decode({
        password: tokenSecret,
        token: tokenString
    })
        .then((decryptedToken) => decryptedToken.type === "login"
        ? decryptedToken
        : q_1.default.reject(new error_1.default(400, {
            message: "Invalid type"
        })));
    self[`findBy${capitalize(usernameField)}`] = underscore_1.default.partial(dataModel.findByField, usernameField);
    if (emailField) {
        self[`findBy${capitalize(emailField)}`] = underscore_1.default.partial(dataModel.findByField, emailField);
    }
    if (passwordResetModel) {
        self.sendPasswordReset = (username) => dataModel
            .findByField(usernameField, username)
            .then((userData) => userData ||
            q_1.default.reject(new error_1.default(400, {
                message: "User not found"
            })))
            .then((userData) => {
            const content = {
                type: "password-reset"
            };
            content[usernameField] = userData[usernameField];
            return token_1.default
                .create({
                password: tokenSecret,
                expiresInSeconds: passwordResetExpirationSeconds,
                content: content
            })
                .then((tokenData) => passwordResetModel.send({
                token: tokenData,
                user: userData
            }));
        });
    }
    self.resetPasswordWithToken = (fig) => (0, validate_1.default)({
        token: ["required", "type:string"],
        newPassword: ["required", "type:string"]
    }, fig)
        .then(() => token_1.default.decode({
        password: tokenSecret,
        token: fig.token
    }))
        .then((tokenData) => tokenData.type === "password-reset"
        ? tokenData[usernameField]
        : q_1.default.reject(new error_1.default(400, {
            message: "Invalid type"
        })))
        .then((username) => {
        return password_1.default.hash(fig.newPassword).then((hashedPassword) => {
            const setFig = {
                password: hashedPassword
            };
            setFig[usernameField] = username;
            return dataModel[`setPasswordBy${capitalize(usernameField)}`](setFig);
        });
    });
    if (confirmationModel) {
        self.sendConfirmation = (username) => dataModel
            .findByField(usernameField, username)
            .then((userData) => userData ||
            q_1.default.reject(new error_1.default(400, {
                message: "User not found"
            })))
            .then((userData) => userData.isConfirmed
            ? q_1.default.reject(new error_1.default(400, {
                message: "User is already confirmed"
            }))
            : userData)
            .then((userData) => {
            const content = {
                type: "confirmation"
            };
            content[usernameField] = userData[usernameField];
            return token_1.default
                .create({
                password: tokenSecret,
                expiresInSeconds: confirmationExpirationSeconds,
                content: content
            })
                .then((tokenData) => confirmationModel.send({
                token: tokenData,
                user: userData
            }));
        });
    }
    self.confirmWithToken = (confirmationToken) => token_1.default
        .decode({
        password: tokenSecret,
        token: confirmationToken
    })
        .then((tokenData) => tokenData.type === "confirmation"
        ? tokenData[usernameField]
        : q_1.default.reject(new error_1.default(400, {
            message: "Invalid type"
        })))
        .then((username) => {
        const setFig = {
            isConfirmed: true
        };
        setFig[usernameField] = username;
        return dataModel.setConfirmedByUsername(setFig);
    });
    return self;
};
module.exports = fn;
exports.default = fn;
//# sourceMappingURL=model.js.map