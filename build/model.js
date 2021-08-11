"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('underscore');
var Q = require('q');
var ValidationError = require('./error');
var validate = require('./validate');
var password = require('./password');
var token = require('./token');
module.exports = function (fig) {
    var self = {};
    var dataModel = fig.dataModel;
    var confirmationModel = fig.confirmationModel;
    var passwordResetModel = fig.passwordResetModel;
    var tokenSecret = fig.tokenSecret;
    var loginExpirationSeconds = fig.loginExpirationSeconds || 60 * 60;
    var passwordResetExpirationSeconds = fig.passwordResetExpirationSeconds || 60 * 5;
    var confirmationExpirationSeconds = fig.confirmationExpirationSeconds || 60 * 60 * 24;
    var emailField = fig.emailField;
    var usernameField = fig.usernameField || 'username';
    var capitalize = function (string) { return string.charAt(0).toUpperCase() + string.slice(1); };
    var schema = function () {
        var s = {
            password: ['required', 'type:string'],
        };
        s[usernameField] = ['required', 'type:string'];
        if (emailField) {
            s[emailField] = ['required', 'type:string', 'email'];
        }
        return s;
    };
    self.register = function (fig) {
        return validate(schema(), fig)
            .then(function () { return dataModel.findByField(usernameField, fig.username); })
            .then(function (userData) {
            return userData &&
                Q.reject(new ValidationError(400, {
                    message: "The supplied " + usernameField + " has already been taken",
                }));
        })
            .then(function () {
            return emailField && emailField !== usernameField
                ? dataModel.findByField(emailField, fig[emailField]).then(function (userData) {
                    return userData &&
                        Q.reject(new ValidationError(400, {
                            message: 'The supplied ' + emailField + ' has already been taken',
                        }));
                })
                : Q();
        })
            .then(function () { return password.hash(fig.password); })
            .then(function (hashedPassword) {
            return dataModel.insert(_.extend(_.clone(fig), {
                password: hashedPassword,
                isConfirmed: false,
            }));
        });
    };
    self.login = function (fig) {
        var loginError = new ValidationError(400, {
            message: "Invalid " + usernameField + " or password",
        });
        var validateFig = {
            password: ['required', 'type:string'],
        };
        var usernameOrEmailField = emailField
            ? usernameField + "Or" + capitalize(emailField)
            : usernameField;
        validateFig[usernameOrEmailField] = ['required', 'type:string'];
        return validate(validateFig, fig)
            .then(function () {
            return dataModel.findByField(usernameField, fig[usernameOrEmailField]);
        })
            .then(function (userData) {
            return !userData && emailField && emailField !== usernameField
                ? dataModel.findByField(emailField, fig[usernameOrEmailField])
                : userData;
        })
            .then(function (userData) { return userData || Q.reject(loginError); })
            .then(function (userData) {
            return password
                .compare(fig.password, userData.password)
                .then(function (isMatch) { return isMatch || Q.reject(loginError); })
                .then(function () {
                var content = {
                    type: 'login',
                };
                content[usernameField] = userData[usernameField];
                return token.create({
                    password: tokenSecret,
                    expiresInSeconds: loginExpirationSeconds,
                    content: content,
                });
            });
        });
    };
    self.validateLoginToken = function (tokenString) {
        return token
            .decode({
            password: tokenSecret,
            token: tokenString,
        })
            .then(function (decryptedToken) {
            return decryptedToken.type === 'login'
                ? decryptedToken
                : Q.reject(new ValidationError(400, {
                    message: 'Invalid type',
                }));
        });
    };
    self["findBy" + capitalize(usernameField)] = _.partial(dataModel.findByField, usernameField);
    if (emailField) {
        self["findBy" + capitalize(emailField)] = _.partial(dataModel.findByField, emailField);
    }
    if (passwordResetModel) {
        self.sendPasswordReset = function (username) {
            return dataModel
                .findByField(usernameField, username)
                .then(function (userData) {
                return userData ||
                    Q.reject(new ValidationError(400, {
                        message: 'User not found',
                    }));
            })
                .then(function (userData) {
                var content = {
                    type: 'password-reset',
                };
                content[usernameField] = userData[usernameField];
                return token
                    .create({
                    password: tokenSecret,
                    expiresInSeconds: passwordResetExpirationSeconds,
                    content: content,
                })
                    .then(function (tokenData) {
                    return passwordResetModel.send({
                        token: tokenData,
                        user: userData,
                    });
                });
            });
        };
    }
    self.resetPasswordWithToken = function (fig) {
        return validate({
            token: ['required', 'type:string'],
            newPassword: ['required', 'type:string'],
        }, fig)
            .then(function () {
            return token.decode({
                password: tokenSecret,
                token: fig.token,
            });
        })
            .then(function (tokenData) {
            return tokenData.type === 'password-reset'
                ? tokenData[usernameField]
                : Q.reject(new ValidationError(400, {
                    message: 'Invalid type',
                }));
        })
            .then(function (username) {
            return password.hash(fig.newPassword).then(function (hashedPassword) {
                var setFig = {
                    password: hashedPassword,
                };
                setFig[usernameField] = username;
                return dataModel["setPasswordBy" + capitalize(usernameField)](setFig);
            });
        });
    };
    if (confirmationModel) {
        self.sendConfirmation = function (username) {
            return dataModel
                .findByField(usernameField, username)
                .then(function (userData) {
                return userData ||
                    Q.reject(new ValidationError(400, {
                        message: 'User not found',
                    }));
            })
                .then(function (userData) {
                return userData.isConfirmed
                    ? Q.reject(new ValidationError(400, {
                        message: 'User is already confirmed',
                    }))
                    : userData;
            })
                .then(function (userData) {
                var content = {
                    type: 'confirmation',
                };
                content[usernameField] = userData[usernameField];
                return token
                    .create({
                    password: tokenSecret,
                    expiresInSeconds: confirmationExpirationSeconds,
                    content: content,
                })
                    .then(function (tokenData) {
                    return confirmationModel.send({
                        token: tokenData,
                        user: userData,
                    });
                });
            });
        };
    }
    self.confirmWithToken = function (confirmationToken) {
        return token
            .decode({
            password: tokenSecret,
            token: confirmationToken,
        })
            .then(function (tokenData) {
            return tokenData.type === 'confirmation'
                ? tokenData[usernameField]
                : Q.reject(new ValidationError(400, {
                    message: 'Invalid type',
                }));
        })
            .then(function (username) {
            var setFig = {
                isConfirmed: true,
            };
            setFig[usernameField] = username;
            return dataModel.setConfirmedByUsername(setFig);
        });
    };
    return self;
};
//# sourceMappingURL=model.js.map