"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('underscore');
var Q = require('q');
var chai = require('chai');
var password = require('./password');
var token = require('./token');
var dataModel = require('./data-model-memory')();
var self = this;
var createModel = function (override) { return require('./model')(_.extend({
    dataModel: dataModel,
    tokenSecret: 'secret',
    loginExpirationSeconds: 2,
    passwordResetExpirationSeconds: 2,
    confirmationExpirationSeconds: 2
}, override)); };
var model = createModel();
describe('model', function () {
    beforeEach(function (done) {
        self.data = function () { return ({
            username: 'username',
            password: 'password'
        }); };
        dataModel.clearData();
        self.assertValidationError = function (err) {
            chai.assert.strictEqual(err.message, 'A validation error occurred');
        };
        self.assertLoginError = function (err) {
            chai.assert.strictEqual(err.message, 'Invalid username or password');
        };
        password.hash('password').then(function (hashedPassword) { return dataModel.insert({
            username: 'bob',
            email: 'bob@foo.com',
            password: hashedPassword
        }); }).then(function () { return dataModel.findByField('username', 'bob'); }).then(function (user) {
            self.user = user;
            return token.create({
                password: 'secret',
                expiresInSeconds: 5,
                content: {
                    type: 'wrong',
                    username: self.user.username
                }
            });
        }).then(function (tokenData) {
            self.invalidToken = tokenData;
            done();
        }).done();
    });
    describe('register', function () {
        it('should create unconfirmed user with hashed password', function (done) {
            model.register(self.data()).then(function () { return dataModel.findByField('username', self.data().username); }).then(function (user) {
                chai.assert.deepEqual(_.omit(user, 'password'), {
                    username: self.data().username,
                    isConfirmed: false
                });
                return password.compare(self.data().password, user.password);
            }).then(function (isMatch) {
                chai.assert.ok(isMatch);
                done();
            }).done();
        });
        it('should require username', function (done) {
            model.register(_.omit(self.data(), 'username')).catch(function (err) {
                self.assertValidationError(err);
                done();
            }).done();
        });
        it('should require password', function (done) {
            model.register(_.omit(self.data(), 'password')).catch(function (err) {
                self.assertValidationError(err);
                done();
            }).done();
        });
        it('should require username is unique', function (done) {
            model.register(_.extend(self.data(), {
                username: self.user.username
            })).catch(function (err) {
                chai.assert.strictEqual(err.message, 'The supplied username has already been taken');
                done();
            }).done();
        });
    });
    describe('register (with emailField)', function () {
        beforeEach(function (done) {
            self.data = function () { return ({
                username: 'username',
                email: 'mail@foo.com',
                password: 'password'
            }); };
            self.model = createModel({
                emailField: 'email'
            });
            done();
        });
        it('should create unconfirmed user with hashed password', function (done) {
            self.model.register(self.data()).then(function () { return dataModel.findByField('username', self.data().username); }).then(function (user) {
                chai.assert.deepEqual(_.omit(user, 'password'), {
                    username: self.data().username,
                    email: self.data().email,
                    isConfirmed: false
                });
                return password.compare(self.data().password, user.password);
            }).then(function (isMatch) {
                chai.assert.ok(isMatch);
                done();
            }).done();
        });
        it('should require email', function (done) {
            self.model.register(_.omit(self.data(), 'email')).catch(function (err) {
                self.assertValidationError(err);
                done();
            }).done();
        });
        it('should require valid email format', function (done) {
            self.model.register(_.extend(self.data(), {
                email: 'wrong'
            })).catch(function (err) {
                self.assertValidationError(err);
                done();
            }).done();
        });
        it('should require that email is unique', function (done) {
            self.model.register(_.extend(self.data(), {
                email: self.user.email
            })).catch(function (err) {
                chai.assert.strictEqual(err.message, 'The supplied email has already been taken');
                done();
            }).done();
        });
    });
    describe('register (with emailField the same as username)', function () {
        beforeEach(function (done) {
            self.data = function () { return ({
                username: 'mail@foo.com',
                password: 'password'
            }); };
            self.model = createModel({
                emailField: 'username'
            });
            done();
        });
        it('should create unconfirmed user with hashed password', function (done) {
            self.model.register(self.data()).then(function () { return dataModel.findByField('username', self.data().username); }).then(function (user) {
                chai.assert.deepEqual(_.omit(user, 'password'), {
                    username: self.data().username,
                    isConfirmed: false
                });
                return password.compare(self.data().password, user.password);
            }).then(function (isMatch) {
                chai.assert.ok(isMatch);
                done();
            }).done();
        });
        it('should require valid email format', function (done) {
            self.model.register(_.extend(self.data(), {
                username: 'wrong'
            })).catch(function (err) {
                self.assertValidationError(err);
                done();
            }).done();
        });
    });
    describe('login', function () {
        it('should return a valid login token', function (done) {
            model.login({
                username: self.user.username,
                password: 'password'
            }).then(function (loginToken) { return token.decode({
                password: 'secret',
                token: loginToken
            }); }).then(function (decodedToken) {
                chai.assert.deepEqual(decodedToken, {
                    type: 'login',
                    username: self.user.username
                });
                done();
            }).done();
        });
        it('should validate that user exists with username', function (done) {
            model.login({
                username: 'wrong',
                password: 'password'
            }).catch(function (err) {
                self.assertLoginError(err);
                done();
            }).done();
        });
        it('should validate that password is correct', function (done) {
            model.login({
                username: self.user.username,
                password: 'wrong'
            }).catch(function (err) {
                self.assertLoginError(err);
                done();
            }).done();
        });
    });
    describe('login (with email field)', function () {
        beforeEach(function (done) {
            self.model = createModel({
                emailField: 'email'
            });
            done();
        });
        it('should login with email', function (done) {
            self.model.login({
                usernameOrEmail: self.user.email,
                password: 'password'
            }).then(function (token) {
                chai.assert.ok(token);
                done();
            }).done();
        });
        it('should login with username', function (done) {
            self.model.login({
                usernameOrEmail: self.user.username,
                password: 'password'
            }).then(function (token) {
                chai.assert.ok(token);
                done();
            }).done();
        });
        it('should validate that user exists with email', function (done) {
            self.model.login({
                usernameOrEmail: 'wrong@mail.com',
                password: 'password'
            }).catch(function (err) {
                console.log(JSON.stringify(err.toJSON(), null, 2));
                self.assertLoginError(err);
                done();
            }).done();
        });
        it('should validate that password is correct', function (done) {
            self.model.login({
                usernameOrEmail: self.user.email,
                password: 'wrong'
            }).catch(function (err) {
                self.assertLoginError(err);
                done();
            }).done();
        });
    });
    describe('validateLoginToken', function () {
        beforeEach(function (done) {
            token.create({
                password: 'secret',
                expiresInSeconds: 2,
                content: {
                    type: 'login',
                    username: self.user.username
                }
            }).then(function (tokenData) {
                self.token = tokenData;
                done();
            }).done();
        });
        it('should extract login token', function (done) {
            model.validateLoginToken(self.token).then(function (decodedToken) {
                chai.assert.deepEqual(decodedToken, {
                    type: 'login',
                    username: self.user.username
                });
                done();
            }).done();
        });
        it('should validate that token has correct type', function (done) {
            model.validateLoginToken(self.invalidToken).catch(function (err) {
                chai.assert.strictEqual(err.message, 'Invalid type');
                done();
            }).done();
        });
    });
    describe('findByUsername', function () {
        it('should find by username', function (done) {
            model.findByUsername(self.user.username).then(function (user) {
                chai.assert.deepEqual(user, self.user);
                done();
            }).done();
        });
        it('should not find for wrong username', function (done) {
            model.findByUsername('wrong').then(function (user) {
                chai.assert.notOk(user);
                done();
            }).done();
        });
    });
    describe('findByEmail', function () {
        beforeEach(function (done) {
            self.model = createModel({
                emailField: 'email'
            });
            done();
        });
        it('should find by email', function (done) {
            self.model.findByEmail(self.user.email).then(function (user) {
                chai.assert.deepEqual(user, self.user);
                done();
            }).done();
        });
        it('should not find for wrong email', function (done) {
            self.model.findByEmail('wrong').then(function (user) {
                chai.assert.notOk(user);
                done();
            }).done();
        });
        it('should not have method if emailField not configured', function (done) {
            chai.assert.notOk(model.findByEmail);
            done();
        });
    });
    describe('sendPasswordReset', function () {
        beforeEach(function (done) {
            self.calledSend = false;
            self.model = createModel({
                passwordResetModel: {
                    send: function (fig) {
                        chai.assert.deepEqual(fig.user, self.user);
                        return token.decode({
                            password: 'secret',
                            token: fig.token
                        }).then(function (decodedToken) {
                            chai.assert.deepEqual(decodedToken, {
                                type: 'password-reset',
                                username: self.user.username
                            });
                            self.calledSend = true;
                        });
                    }
                }
            });
            done();
        });
        it('should send password reset with token', function (done) {
            self.model.sendPasswordReset(self.user.username).then(function () {
                chai.assert.ok(self.calledSend);
                done();
            }).done();
        });
        it('should validate that user exists', function (done) {
            self.model.sendPasswordReset('wrong').catch(function (err) {
                chai.assert.strictEqual(err.message, 'User not found');
                done();
            }).done();
        });
    });
    describe('sendConfirmation', function () {
        beforeEach(function (done) {
            self.calledSend = false;
            self.model = createModel({
                confirmationModel: {
                    send: function (fig) {
                        chai.assert.deepEqual(fig.user, self.user);
                        return token.decode({
                            password: 'secret',
                            token: fig.token
                        }).then(function (decodedToken) {
                            chai.assert.deepEqual(decodedToken, {
                                type: 'confirmation',
                                username: self.user.username
                            });
                            self.calledSend = true;
                        });
                    }
                }
            });
            done();
        });
        it('should send confirmation with token', function (done) {
            self.model.sendConfirmation(self.user.username).then(function () {
                chai.assert.ok(self.calledSend);
                done();
            }).done();
        });
        it('should validate that user exists', function (done) {
            self.model.sendConfirmation('wrong').catch(function (err) {
                chai.assert.strictEqual(err.message, 'User not found');
                done();
            }).done();
        });
        it('should validate that user is not already confirmed', function (done) {
            dataModel.clearData();
            dataModel.insert(_.extend(self.user, {
                isConfirmed: true
            })).then(function () { return self.model.sendConfirmation(self.user.username); }).catch(function (err) {
                chai.assert.strictEqual(err.message, 'User is already confirmed');
                done();
            }).done();
        });
    });
    describe('resetPasswordWithToken', function () {
        beforeEach(function (done) {
            token.create({
                password: 'secret',
                expiresInSeconds: 3,
                content: {
                    type: 'password-reset',
                    username: self.user.username
                }
            }).then(function (tokenData) {
                self.passwordResetToken = tokenData;
                done();
            }).done();
        });
        it('should reset password', function (done) {
            model.resetPasswordWithToken({
                token: self.passwordResetToken,
                newPassword: 'new-pass'
            }).then(function () { return dataModel.findByField('username', self.user.username); }).then(function (userData) { return password.compare('new-pass', userData.password); }).then(function (isMatch) {
                chai.assert.ok(isMatch);
                done();
            }).done();
        });
        it('should validate token type', function (done) {
            model.resetPasswordWithToken({
                token: self.invalidToken,
                newPassword: 'new-pass'
            }).catch(function (err) {
                chai.assert.strictEqual(err.message, 'Invalid type');
                done();
            }).done();
        });
    });
    describe('confirmWithToken', function () {
        beforeEach(function (done) {
            token.create({
                password: 'secret',
                expiresInSeconds: 3,
                content: {
                    type: 'confirmation',
                    username: self.user.username
                }
            }).then(function (tokenData) {
                self.confirmationToken = tokenData;
                done();
            }).done();
        });
        it('should set user to confirmed', function (done) {
            model.confirmWithToken(self.confirmationToken).then(function () { return dataModel.findByField('username', self.user.username); }).then(function (userData) {
                chai.assert.ok(userData.isConfirmed);
                done();
            }).done();
        });
        it('should validate token type', function (done) {
            model.confirmWithToken(self.invalidToken).catch(function (err) {
                chai.assert.strictEqual(err.message, 'Invalid type');
                done();
            }).done();
        });
    });
});
//# sourceMappingURL=model.unit.js.map