import model from './model';
import dataModelMysql from './data-model-mysql';
import notificationModelEMail from './notification-model-email';

const _exports: any = {};

_exports.model = model;
_exports.dataModelMysql = dataModelMysql;
_exports.notificationModelEMail = notificationModelEMail;

module.exports = _exports;
export default _exports;