"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('underscore');
var Q = require('q');
var chai = require('chai');
var mysql = require('mysql');
var self = this;
var connection = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'secret',
    database: 'user-basic',
});
var sql = require('mysql-wrap-production')(connection);
var dataModel = require('./data-model-mysql')({
    table: 'user',
    connection: connection,
});
describe('dataModelMysql', function () {
    beforeEach(function (done) {
        self.data = function () { return ({
            username: 'bob',
            password: 'password',
        }); };
        sql
            .delete('user')
            .then(function () {
            return sql.insert('user', {
                username: 'foo',
                password: 'password',
            });
        })
            .then(function () { return sql.selectOne('user'); })
            .then(function (userData) {
            self.user = userData;
            done();
        })
            .done();
    });
    describe('insert', function () {
        it('should save new user to database', function (done) {
            dataModel
                .insert(self.data())
                .then(function () {
                return sql.selectOne('user', {
                    username: self.data().username,
                });
            })
                .then(function (userData) {
                chai.assert.deepEqual(userData, _.extend(self.data(), {
                    isConfirmed: 0,
                }));
                done();
            })
                .done();
        });
    });
    describe('findByField', function () {
        it('should find by username success', function (done) {
            dataModel
                .findByField('username', self.user.username)
                .then(function (userData) {
                chai.assert.deepEqual(userData, _.extend(self.user, {
                    isConfirmed: false,
                }));
                done();
            })
                .done();
        });
        it('should find by username fail', function (done) {
            dataModel
                .findByField('username', 'wrong')
                .then(function (userData) {
                chai.assert.notOk(userData);
                done();
            })
                .done();
        });
    });
    describe('setConfirmedByUsername', function () {
        it('should set isConfirmed', function (done) {
            dataModel
                .setConfirmedByUsername({
                username: self.user.username,
                isConfirmed: true,
            })
                .then(function () {
                return sql.selectOne('user', {
                    username: self.user.username,
                });
            })
                .then(function (userData) {
                chai.assert.ok(userData.isConfirmed);
                done();
            })
                .done();
        });
        it('should not set for wrong username', function (done) {
            dataModel
                .setConfirmedByUsername({
                username: 'wrong',
                isConfirmed: true,
            })
                .then(function () {
                return sql.selectOne('user', {
                    username: self.user.username,
                });
            })
                .then(function (userData) {
                chai.assert.notOk(userData.isConfirmed);
                done();
            })
                .done();
        });
    });
    describe('setPasswordByUsername', function () {
        it('should set password', function (done) {
            dataModel
                .setPasswordByUsername({
                username: self.user.username,
                password: 'new-password',
            })
                .then(function () {
                return sql.selectOne('user', {
                    username: self.user.username,
                });
            })
                .then(function (userData) {
                chai.assert.strictEqual(userData.password, 'new-password');
                done();
            })
                .done();
        });
    });
});
//# sourceMappingURL=data-model-mysql.unit.js.map