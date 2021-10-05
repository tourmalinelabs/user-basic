import _ from 'underscore';
import Q from 'q';
import Validator from 'the_validator';
import ValidationError from './error';

const fn = (rules, data) => {
  const errors = new Validator(rules, {
    strict: false,
  }).test(data);
  return _.isEmpty(errors)
    ? Q()
    : Q.reject(
        new ValidationError(400, {
          message: 'A validation error occurred',
          errors: errors,
        })
      );
};

module.exports = fn;
export default fn;