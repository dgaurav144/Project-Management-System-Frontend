import { ApiError } from '../utils/apiError.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const formattedErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      // Extract the first meaningful message so clients immediately see the specific field issue
      const primaryMessage = formattedErrors[0]?.message || 'Please check the provided input values.';

      return next(ApiError.badRequest(primaryMessage, formattedErrors));
    }

    req[source] = value;
    next();
  };
};
