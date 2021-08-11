"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require('underscore');
const Q = require('q');
const chai = require('chai');
const password = require('./password');
const token = require('./token');
const dataModel = require('./data-model-memory')();
const self = this;
const createModel = (override) => require('./model')(_.extend({
    dataModel: dataModel,
    tokenSecret: 'secret',
    loginExpirationSeconds: 2,
    passwordResetExpirationSeconds: 2,
    confirmationExpirationSeconds: 2,
}, override));
const model = createModel();
describe('model', () => {
    beforeEach((done) => {
        self.data = () => ({
            username: 'username',
            password: 'password',
        });
        dataModel.clearData();
        self.assertValidationError = err => {
            chai.assert.strictEqual(err.message, 'A validation error occurred');
        };
        self.assertLoginError = err => {
            chai.assert.strictEqual(err.message, 'Invalid username or password');
        };
        password
            .hash('password')
            .then(hashedPassword => dataModel.insert({
            username: 'bob',
            email: 'bob@foo.com',
            password: hashedPassword,
        }))
            .then(() => dataModel.findByField('username', 'bob'))
            .then(user => {
            self.user = user;
            return token.create({
                password: 'secret',
                expiresInSeconds: 5,
                content: {
                    type: 'wrong',
                    username: self.user.username,
                },
            });
        })
            .then(tokenData => {
            self.invalidToken = tokenData;
            done();
        })
            .done();
    });
    describe('register', () => {
        it('should create unconfirmed user with hashed password', (done) => {
            model
                .register(self.data())
                .then(() => dataModel.findByField('username', self.data().username))
                .then(user => {
                chai.assert.deepEqual(_.omit(user, 'password'), {
                    username: self.data().username,
                    isConfirmed: false,
                });
                return password.compare(self.data().password, user.password);
            })
                .then(isMatch => {
                chai.assert.ok(isMatch);
                done();
            })
                .done();
        });
        it('should require username', (done) => {
            model
                .register(_.omit(self.data(), 'username'))
                .catch(err => {
                self.assertValidationError(err);
                done();
            })
                .done();
        });
        it('should require password', (done) => {
            model
                .register(_.omit(self.data(), 'password'))
                .catch(err => {
                self.assertValidationError(err);
                done();
            })
                .done();
        });
        it('should require username is unique', (done) => {
            model
                .register(_.extend(self.data(), {
                username: self.user.username,
            }))
                .catch(err => {
                chai.assert.strictEqual(err.message, 'The supplied username has already been taken');
                done();
            })
                .done();
        });
    });
    describe('register (with emailField)', () => {
        beforeEach((done) => {
            self.data = () => ({
                username: 'username',
                email: 'mail@foo.com',
                password: 'password',
            });
            self.model = createModel({
                emailField: 'email',
            });
            done();
        });
        it('should create unconfirmed user with hashed password', (done) => {
            self.model
                .register(self.data())
                .then(() => dataModel.findByField('username', self.data().username))
                .then(user => {
                chai.assert.deepEqual(_.omit(user, 'password'), {
                    username: self.data().username,
                    email: self.data().email,
                    isConfirmed: false,
                });
                return password.compare(self.data().password, user.password);
            })
                .then(isMatch => {
                chai.assert.ok(isMatch);
                done();
            })
                .done();
        });
        it('should require email', (done) => {
            self.model
                .register(_.omit(self.data(), 'email'))
                .catch(err => {
                self.assertValidationError(err);
                done();
            })
                .done();
        });
        it('should require valid email format', (done) => {
            self.model
                .register(_.extend(self.data(), {
                email: 'wrong',
            }))
                .catch(err => {
                self.assertValidationError(err);
                done();
            })
                .done();
        });
        it('should require that email is unique', (done) => {
            self.model
                .register(_.extend(self.data(), {
                email: self.user.email,
            }))
                .catch(err => {
                chai.assert.strictEqual(err.message, 'The supplied email has already been taken');
                done();
            })
                .done();
        });
    });
    describe('register (with emailField the same as username)', () => {
        beforeEach((done) => {
            self.data = () => ({
                username: 'mail@foo.com',
                password: 'password',
            });
            self.model = createModel({
                emailField: 'username',
            });
            done();
        });
        it('should create unconfirmed user with hashed password', (done) => {
            self.model
                .register(self.data())
                .then(() => dataModel.findByField('username', self.data().username))
                .then(user => {
                chai.assert.deepEqual(_.omit(user, 'password'), {
                    username: self.data().username,
                    isConfirmed: false,
                });
                return password.compare(self.data().password, user.password);
            })
                .then(isMatch => {
                chai.assert.ok(isMatch);
                done();
            })
                .done();
        });
        it('should require valid email format', (done) => {
            self.model
                .register(_.extend(self.data(), {
                username: 'wrong',
            }))
                .catch(err => {
                self.assertValidationError(err);
                done();
            })
                .done();
        });
    });
    describe('login', () => {
        it('should return a valid login token', (done) => {
            model
                .login({
                username: self.user.username,
                password: 'password',
            })
                .then(loginToken => token.decode({
                password: 'secret',
                token: loginToken,
            }))
                .then(decodedToken => {
                chai.assert.deepEqual(decodedToken, {
                    type: 'login',
                    username: self.user.username,
                });
                done();
            })
                .done();
        });
        it('should validate that user exists with username', (done) => {
            model
                .login({
                username: 'wrong',
                password: 'password',
            })
                .catch(err => {
                self.assertLoginError(err);
                done();
            })
                .done();
        });
        it('should validate that password is correct', (done) => {
            model
                .login({
                username: self.user.username,
                password: 'wrong',
            })
                .catch(err => {
                self.assertLoginError(err);
                done();
            })
                .done();
        });
    });
    describe('login (with email field)', () => {
        beforeEach((done) => {
            self.model = createModel({
                emailField: 'email',
            });
            done();
        });
        it('should login with email', (done) => {
            self.model
                .login({
                usernameOrEmail: self.user.email,
                password: 'password',
            })
                .then(token => {
                chai.assert.ok(token);
                done();
            })
                .done();
        });
        it('should login with username', (done) => {
            self.model
                .login({
                usernameOrEmail: self.user.username,
                password: 'password',
            })
                .then(token => {
                chai.assert.ok(token);
                done();
            })
                .done();
        });
        it('should validate that user exists with email', (done) => {
            self.model
                .login({
                usernameOrEmail: 'wrong@mail.com',
                password: 'password',
            })
                .catch(err => {
                console.log(JSON.stringify(err.toJSON(), null, 2));
                self.assertLoginError(err);
                done();
            })
                .done();
        });
        it('should validate that password is correct', (done) => {
            self.model
                .login({
                usernameOrEmail: self.user.email,
                password: 'wrong',
            })
                .catch(err => {
                self.assertLoginError(err);
                done();
            })
                .done();
        });
    });
    describe('validateLoginToken', () => {
        beforeEach((done) => {
            token
                .create({
                password: 'secret',
                expiresInSeconds: 2,
                content: {
                    type: 'login',
                    username: self.user.username,
                },
            })
                .then(tokenData => {
                self.token = tokenData;
                done();
            })
                .done();
        });
        it('should extract login token', (done) => {
            model
                .validateLoginToken(self.token)
                .then(decodedToken => {
                chai.assert.deepEqual(decodedToken, {
                    type: 'login',
                    username: self.user.username,
                });
                done();
            })
                .done();
        });
        it('should validate that token has correct type', (done) => {
            model
                .validateLoginToken(self.invalidToken)
                .catch(err => {
                chai.assert.strictEqual(err.message, 'Invalid type');
                done();
            })
                .done();
        });
    });
    describe('findByUsername', () => {
        it('should find by username', (done) => {
            model
                .findByUsername(self.user.username)
                .then(user => {
                chai.assert.deepEqual(user, self.user);
                done();
            })
                .done();
        });
        it('should not find for wrong username', (done) => {
            model
                .findByUsername('wrong')
                .then(user => {
                chai.assert.notOk(user);
                done();
            })
                .done();
        });
    });
    describe('findByEmail', () => {
        beforeEach((done) => {
            self.model = createModel({
                emailField: 'email',
            });
            done();
        });
        it('should find by email', (done) => {
            self.model
                .findByEmail(self.user.email)
                .then(user => {
                chai.assert.deepEqual(user, self.user);
                done();
            })
                .done();
        });
        it('should not find for wrong email', (done) => {
            self.model
                .findByEmail('wrong')
                .then(user => {
                chai.assert.notOk(user);
                done();
            })
                .done();
        });
        it('should not have method if emailField not configured', (done) => {
            chai.assert.notOk(model.findByEmail);
            done();
        });
    });
    describe('sendPasswordReset', () => {
        beforeEach((done) => {
            self.calledSend = false;
            self.model = createModel({
                passwordResetModel: {
                    send: fig => {
                        chai.assert.deepEqual(fig.user, self.user);
                        return token
                            .decode({
                            password: 'secret',
                            token: fig.token,
                        })
                            .then(decodedToken => {
                            chai.assert.deepEqual(decodedToken, {
                                type: 'password-reset',
                                username: self.user.username,
                            });
                            self.calledSend = true;
                        });
                    },
                },
            });
            done();
        });
        it('should send password reset with token', (done) => {
            self.model
                .sendPasswordReset(self.user.username)
                .then(() => {
                chai.assert.ok(self.calledSend);
                done();
            })
                .done();
        });
        it('should validate that user exists', (done) => {
            self.model
                .sendPasswordReset('wrong')
                .catch(err => {
                chai.assert.strictEqual(err.message, 'User not found');
                done();
            })
                .done();
        });
    });
    describe('sendConfirmation', () => {
        beforeEach((done) => {
            self.calledSend = false;
            self.model = createModel({
                confirmationModel: {
                    send: fig => {
                        chai.assert.deepEqual(fig.user, self.user);
                        return token
                            .decode({
                            password: 'secret',
                            token: fig.token,
                        })
                            .then(decodedToken => {
                            chai.assert.deepEqual(decodedToken, {
                                type: 'confirmation',
                                username: self.user.username,
                            });
                            self.calledSend = true;
                        });
                    },
                },
            });
            done();
        });
        it('should send confirmation with token', (done) => {
            self.model
                .sendConfirmation(self.user.username)
                .then(() => {
                chai.assert.ok(self.calledSend);
                done();
            })
                .done();
        });
        it('should validate that user exists', (done) => {
            self.model
                .sendConfirmation('wrong')
                .catch(err => {
                chai.assert.strictEqual(err.message, 'User not found');
                done();
            })
                .done();
        });
        it('should validate that user is not already confirmed', (done) => {
            dataModel.clearData();
            dataModel
                .insert(_.extend(self.user, {
                isConfirmed: true,
            }))
                .then(() => self.model.sendConfirmation(self.user.username))
                .catch(err => {
                chai.assert.strictEqual(err.message, 'User is already confirmed');
                done();
            })
                .done();
        });
    });
    describe('resetPasswordWithToken', () => {
        beforeEach((done) => {
            token
                .create({
                password: 'secret',
                expiresInSeconds: 3,
                content: {
                    type: 'password-reset',
                    username: self.user.username,
                },
            })
                .then(tokenData => {
                self.passwordResetToken = tokenData;
                done();
            })
                .done();
        });
        it('should reset password', (done) => {
            model
                .resetPasswordWithToken({
                token: self.passwordResetToken,
                newPassword: 'new-pass',
            })
                .then(() => dataModel.findByField('username', self.user.username))
                .then(userData => password.compare('new-pass', userData.password))
                .then(isMatch => {
                chai.assert.ok(isMatch);
                done();
            })
                .done();
        });
        it('should validate token type', (done) => {
            model
                .resetPasswordWithToken({
                token: self.invalidToken,
                newPassword: 'new-pass',
            })
                .catch(err => {
                chai.assert.strictEqual(err.message, 'Invalid type');
                done();
            })
                .done();
        });
    });
    describe('confirmWithToken', () => {
        beforeEach((done) => {
            token
                .create({
                password: 'secret',
                expiresInSeconds: 3,
                content: {
                    type: 'confirmation',
                    username: self.user.username,
                },
            })
                .then(tokenData => {
                self.confirmationToken = tokenData;
                done();
            })
                .done();
        });
        it('should set user to confirmed', (done) => {
            model
                .confirmWithToken(self.confirmationToken)
                .then(() => dataModel.findByField('username', self.user.username))
                .then(userData => {
                chai.assert.ok(userData.isConfirmed);
                done();
            })
                .done();
        });
        it('should validate token type', (done) => {
            model
                .confirmWithToken(self.invalidToken)
                .catch(err => {
                chai.assert.strictEqual(err.message, 'Invalid type');
                done();
            })
                .done();
        });
    });
});
//# sourceMappingURL=model.unit.js.map