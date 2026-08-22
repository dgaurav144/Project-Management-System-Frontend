import { verifyAccessToken } from '../utils/tokenUtils.js';
import { ApiError } from '../utils/apiError.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    // Check HTTP-only cookie first, then fallback to Authorization header
    let token = req.cookies?.pulseflow_access_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication required. Please sign in.'));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Token expired', [{ code: 'TOKEN_EXPIRED' }]));
      }
      return next(ApiError.unauthorized('Invalid authentication token'));
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return next(ApiError.unauthorized('User account not found or deactivated'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
