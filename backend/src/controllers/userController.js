import User from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export const searchUsers = async (req, res, next) => {
  try {
    const { query = '', limit = 10 } = req.query;

    const filter = { isActive: true };
    if (query.trim()) {
      filter.$or = [
        { name: { $regex: query.trim(), $options: 'i' } },
        { email: { $regex: query.trim(), $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('name email avatar role')
      .limit(parseInt(limit, 10));

    return ApiResponse.success(res, 'Users retrieved successfully', { users });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).select('name email avatar role createdAt');
    return ApiResponse.success(res, 'All users retrieved', { users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('name email avatar role createdAt');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return ApiResponse.success(res, 'User retrieved', { user });
  } catch (error) {
    next(error);
  }
};
