"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require('underscore');
const Q = require('q');
const chai = require('chai');
const mysql = require('mysql');
const self = this;
const connection = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'secret',
    database: 'user-basic',
});
const sql = require('mysql-wrap-production')(connection);
const dataModel = require('./data-model-mysql')({
    table: 'user',
    connection: connection,
});
describe('dataModelMysql', () => {
    beforeEach(done => {
        self.data = () => ({
            username: 'bob',
            password: 'password',
        });
        sql
            .delete('user')
            .then(() => sql.insert('user', {
            username: 'foo',
            password: 'password',
        }))
            .then(() => sql.selectOne('user'))
            .then(userData => {
            self.user = userData;
            done();
        })
            .done();
    });
    describe('insert', () => {
        it('should save new user to database', done => {
            dataModel
                .insert(self.data())
                .then(() => sql.selectOne('user', {
                username: self.data().username,
            }))
                .then(userData => {
                chai.assert.deepEqual(userData, _.extend(self.data(), {
                    isConfirmed: 0,
                }));
                done();
            })
                .done();
        });
    });
    describe('findByField', () => {
        it('should find by username success', done => {
            dataModel
                .findByField('username', self.user.username)
                .then(userData => {
                chai.assert.deepEqual(userData, _.extend(self.user, {
                    isConfirmed: false,
                }));
                done();
            })
                .done();
        });
        it('should find by username fail', done => {
            dataModel
                .findByField('username', 'wrong')
                .then(userData => {
                chai.assert.notOk(userData);
                done();
            })
                .done();
        });
    });
    describe('setConfirmedByUsername', () => {
        it('should set isConfirmed', done => {
            dataModel
                .setConfirmedByUsername({
                username: self.user.username,
                isConfirmed: true,
            })
                .then(() => sql.selectOne('user', {
                username: self.user.username,
            }))
                .then(userData => {
                chai.assert.ok(userData.isConfirmed);
                done();
            })
                .done();
        });
        it('should not set for wrong username', done => {
            dataModel
                .setConfirmedByUsername({
                username: 'wrong',
                isConfirmed: true,
            })
                .then(() => sql.selectOne('user', {
                username: self.user.username,
            }))
                .then(userData => {
                chai.assert.notOk(userData.isConfirmed);
                done();
            })
                .done();
        });
    });
    describe('setPasswordByUsername', () => {
        it('should set password', done => {
            dataModel
                .setPasswordByUsername({
                username: self.user.username,
                password: 'new-password',
            })
                .then(() => sql.selectOne('user', {
                username: self.user.username,
            }))
                .then(userData => {
                chai.assert.strictEqual(userData.password, 'new-password');
                done();
            })
                .done();
        });
    });
});
//# sourceMappingURL=data-model-mysql.unit.js.map