import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { generateTokens, verifyRefreshToken } from '../utils/tokenUtils.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const setAuthCookies = (res, tokens) => {
  res.cookie('pulseflow_access_token', tokens.accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('pulseflow_refresh_token', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
};

export const clearAuthCookies = (res) => {
  res.clearCookie('pulseflow_access_token', ACCESS_COOKIE_OPTIONS);
  res.clearCookie('pulseflow_refresh_token', REFRESH_COOKIE_OPTIONS);
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, avatar } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists. Please sign in or use another email.');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    });

    const tokens = generateTokens(user);

    // Store refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({
      token: tokens.refreshToken,
      user: user._id,
      expiresAt,
    });

    // Set secure HTTP-only cookies
    setAuthCookies(res, tokens);

    return ApiResponse.created(res, 'Account registered successfully', {
      user: user.toSafeObject(),
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password credentials');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
    }

    const tokens = generateTokens(user);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({
      token: tokens.refreshToken,
      user: user._id,
      expiresAt,
    });

    // Set secure HTTP-only cookies
    setAuthCookies(res, tokens);

    return ApiResponse.success(res, 'Logged in successfully', {
      user: user.toSafeObject(),
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    // Read from secure HTTP-only cookie or request body
    const token = req.cookies?.pulseflow_refresh_token || req.body?.refreshToken;
    if (!token) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      clearAuthCookies(res);
      throw ApiError.unauthorized('Invalid or expired session. Please sign in again.');
    }

    const tokenDoc = await RefreshToken.findOne({ token, user: decoded.id, isRevoked: false });
    if (!tokenDoc) {
      clearAuthCookies(res);
      throw ApiError.unauthorized('Session has been revoked. Please sign in again.');
    }

    // Revoke old token and issue a fresh pair (Refresh Token Rotation)
    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      throw ApiError.unauthorized('User not found or inactive');
    }

    const tokens = generateTokens(user);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({
      token: tokens.refreshToken,
      user: user._id,
      expiresAt,
    });

    // Set updated secure HTTP-only cookies
    setAuthCookies(res, tokens);

    return ApiResponse.success(res, 'Token refreshed successfully', {
      user: user.toSafeObject(),
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.pulseflow_refresh_token || req.body?.refreshToken;
    if (token) {
      await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
    }
    // Clear cookies in browser
    clearAuthCookies(res);

    return ApiResponse.success(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return ApiResponse.success(res, 'Current user retrieved', {
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (password) user.password = password;

    await user.save();

    return ApiResponse.success(res, 'Profile updated successfully', {
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};
