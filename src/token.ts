export {};

const _ = require('underscore');

const Q = require('q');

const jwt = require('jsonwebtoken');

const validate = require('./validate');

exports.create = fig =>
  validate(
    {
      password: ['required', 'type:string'],
      expiresInSeconds: ['type:number'],
      content: ['any'],
    },
    fig
  ).then(() =>
    jwt.sign(
      fig.content,
      fig.password,
      _.extend(_.omit(fig, 'content', 'password', 'expiresInSeconds'), {
        algorithm: 'HS256',
        expiresIn: fig.expiresInSeconds,
      })
    )
  );

exports.decode = fig =>
  validate(
    {
      password: ['required', 'type:string'],
      token: ['required', 'type:string'],
    },
    fig
  )
    .then(() =>
      Q.Promise((resolve, reject) =>
        jwt.verify(
          fig.token,
          fig.password,
          {
            algorithms: ['HS256'],
          },
          (err, decoded) => {
            if (err) {
              reject(err);
            } else if (!decoded) {
              reject(new Error('Token is empty'));
            } else {
              resolve(decoded);
            }
          }
        )
      )
    )
    .then(decoded => _.omit(decoded, 'iat', 'exp'));
