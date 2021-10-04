import _ from "underscore";
import Q from "q";
import jwt from "jsonwebtoken";
import validate from "./validate";

const _exports: any = {};

_exports.create = (fig) =>
  validate(
    {
      password: ["required", "type:string"],
      expiresInSeconds: ["type:number"],
      content: ["any"]
    },
    fig
  ).then(() =>
    jwt.sign(
      fig.content,
      fig.password,
      _.extend(_.omit(fig, "content", "password", "expiresInSeconds"), {
        algorithm: "HS256",
        expiresIn: fig.expiresInSeconds
      })
    )
  );

_exports.decode = (fig) =>
  validate(
    {
      password: ["required", "type:string"],
      token: ["required", "type:string"]
    },
    fig
  )
    .then(() =>
      Q.Promise((resolve, reject) =>
        jwt.verify(
          fig.token,
          fig.password,
          {
            algorithms: ["HS256"]
          },
          (err, decoded) => {
            if (err) {
              reject(err);
            } else if (!decoded) {
              reject(new Error("Token is empty"));
            } else {
              resolve(decoded);
            }
          }
        )
      )
    )
    .then((decoded) => _.omit(decoded, "iat", "exp"));

module.exports = _exports;
export default _exports;
