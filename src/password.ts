import Q from 'q';
import bcrypt from 'bcrypt';

const _exports: any = {};

_exports.compare = (plainText, hashed) =>
  Q.promise((resolve, reject) => {
    bcrypt.compare(plainText, hashed, (err, isValid) =>
      err ? reject(err) : resolve(isValid)
    );
  });

_exports.hash = password =>
  Q.promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) =>
      err
        ? reject(err)
        : bcrypt.hash(password, salt, (err, hash) =>
            err ? reject(err) : resolve(hash)
          )
    );
  });

module.exports = _exports;
export default _exports;
