import Q from "q";
import nodemailer from "nodemailer";

const fn = (fig) => {
  const transporter = nodemailer.createTransport(fig);
  const self: any = {};

  self.send = (opt) =>
    Q.Promise((resolve, reject) => {
      transporter.sendMail(opt, (err, info) => (err ? reject(err) : resolve(info)));
    });

  return self;
};

module.exports = fn;
export default fn;
