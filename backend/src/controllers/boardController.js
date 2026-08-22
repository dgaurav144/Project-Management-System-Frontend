import Board from '../models/Board.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { logActivity } from '../utils/activityLogger.js';

export const createBoard = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;

    const boardCount = await Board.countDocuments({ project: projectId });

    const board = await Board.create({
      name,
      description: description || '',
      project: projectId,
      order: boardCount,
      isDefault: boardCount === 0,
    });

    await logActivity({
      project: projectId,
      board: board._id,
      user: req.user._id,
      action: 'BOARD_CREATED',
      details: `${req.user.name} created board "${board.name}"`,
    });

    return ApiResponse.created(res, 'Board created successfully', { board });
  } catch (error) {
    next(error);
  }
};

export const getBoardsByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const boards = await Board.find({ project: projectId }).sort({ order: 1 });

    const boardsWithStats = await Promise.all(
      boards.map(async (board) => {
        const taskCount = await Task.countDocuments({ board: board._id });
        const completedTaskCount = await Task.countDocuments({ board: board._id, status: 'done' });
        return {
          ...board.toObject(),
          taskCount,
          completedTaskCount,
        };
      })
    );

    return ApiResponse.success(res, 'Boards retrieved successfully', { boards: boardsWithStats });
  } catch (error) {
    next(error);
  }
};

export const getBoardById = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const board = await Board.findById(boardId).populate('project', 'name key color members');

    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    return ApiResponse.success(res, 'Board retrieved successfully', { board });
  } catch (error) {
    next(error);
  }
};

export const updateBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { name, description, columns } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    if (name) board.name = name;
    if (description !== undefined) board.description = description;
    if (columns && Array.isArray(columns)) {
      board.columns = columns;
    }

    await board.save();

    return ApiResponse.success(res, 'Board updated successfully', { board });
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const board = await Board.findById(boardId);

    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const totalBoards = await Board.countDocuments({ project: board.project });
    if (totalBoards <= 1) {
      throw ApiError.badRequest('A project must have at least one board. You cannot delete the only board.');
    }

    // Cascade delete tasks in this board
    const taskIds = (await Task.find({ board: boardId }).select('_id')).map((t) => t._id);
    await Comment.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ board: boardId });
    await Board.findByIdAndDelete(boardId);

    return ApiResponse.success(res, 'Board and its tasks deleted successfully');
  } catch (error) {
    next(error);
  }
};
