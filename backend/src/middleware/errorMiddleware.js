import { ApiError } from '../utils/apiError.js';

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Endpoint not found - ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid resource identifier format.`);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = field === 'email'
      ? 'An account with this email address already exists. Please sign in or use another email.'
      : `An entry with this ${field} already exists.`;
    error = ApiError.conflict(message);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message,
    }));
    const primaryMessage = errors[0]?.message || 'Please check your inputs and try again.';
    error = ApiError.badRequest(primaryMessage, errors);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid security token. Please log in again.');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Your session has expired. Please sign in again.', [{ code: 'TOKEN_EXPIRED' }]);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'An unexpected server error occurred. Please try again.';
  const errors = error.errors || [];

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
