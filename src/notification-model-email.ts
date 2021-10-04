import Q from "q";
import createMail from "./mail";

const fn = (fig) => {
  const self: any = {};
  const mail = createMail(fig.smtp);
  const from = fig.from;
  const getToField = fig.getToField;
  const subjectTemplate = fig.subjectTemplate;
  const bodyTemplate = fig.bodyTemplate;

  self.send = (fig) =>
    Q.all([getToField(fig), subjectTemplate(fig), bodyTemplate(fig)]).then((resp) =>
      mail.send({
        from: from,
        to: resp[0],
        subject: resp[1],
        html: resp[2]
      })
    );

  return self;
};

module.exports = fn;
export default fn;