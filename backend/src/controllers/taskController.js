import Task from '../models/Task.js';
import Board from '../models/Board.js';
import Comment from '../models/Comment.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { logActivity } from '../utils/activityLogger.js';

export const createTask = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const {
      title,
      description,
      status = 'todo',
      columnId,
      priority = 'medium',
      dueDate,
      assignees = [],
      tags = [],
      subtasks = [],
      estimatedHours = 0,
    } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    // Determine highest order in this status/column
    const lastTask = await Task.findOne({ board: boardId, status }).sort({ order: -1 });
    const order = lastTask ? lastTask.order + 1000 : 1000;

    const task = await Task.create({
      title,
      description: description || '',
      project: board.project,
      board: boardId,
      status,
      columnId: columnId || (status === 'todo' ? 'col-todo' : status === 'in-progress' ? 'col-inprogress' : status === 'review' ? 'col-review' : 'col-done'),
      priority,
      dueDate: dueDate || null,
      assignees,
      creator: req.user._id,
      tags,
      subtasks,
      order,
      estimatedHours,
    });

    await logActivity({
      project: board.project,
      board: boardId,
      task: task._id,
      user: req.user._id,
      action: 'TASK_CREATED',
      details: `${req.user.name} created task "${task.title}" in ${status.toUpperCase()}`,
      meta: { status, priority },
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email avatar')
      .populate('creator', 'name email avatar');

    return ApiResponse.created(res, 'Task created successfully', { task: populatedTask });
  } catch (error) {
    next(error);
  }
};

export const getTasksByBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const {
      search,
      status,
      priority,
      assignee,
      dueDateFilter,
      sortBy = 'order',
      sortOrder = 'asc',
      page,
      limit,
    } = req.query;

    const filter = { board: boardId };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (assignee) {
      filter.assignees = assignee;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Due date filtering
    if (dueDateFilter) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      if (dueDateFilter === 'overdue') {
        filter.dueDate = { $lt: startOfToday, $ne: null };
        filter.status = { $ne: 'done' };
      } else if (dueDateFilter === 'today') {
        filter.dueDate = { $gte: startOfToday, $lte: endOfToday };
      } else if (dueDateFilter === 'this_week') {
        const endOfWeek = new Date(startOfToday);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        filter.dueDate = { $gte: startOfToday, $lte: endOfWeek };
      }
    }

    const sortOptions = {};
    const direction = sortOrder === 'desc' ? -1 : 1;

    if (sortBy === 'priority') {
      // Sort by priority weight or default order
      sortOptions.priority = direction;
    } else if (sortBy === 'dueDate') {
      sortOptions.dueDate = direction;
    } else if (sortBy === 'createdAt') {
      sortOptions.createdAt = direction;
    } else {
      sortOptions.order = 1;
      sortOptions.createdAt = -1;
    }

    let query = Task.find(filter)
      .populate('assignees', 'name email avatar')
      .populate('creator', 'name email avatar')
      .sort(sortOptions);

    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const tasks = await query;

    // Attach comment counts
    const tasksWithCounts = await Promise.all(
      tasks.map(async (task) => {
        const commentCount = await Comment.countDocuments({ task: task._id });
        return {
          ...task.toObject(),
          commentCount,
        };
      })
    );

    const totalItems = await Task.countDocuments(filter);

    return ApiResponse.success(res, 'Tasks retrieved successfully', {
      tasks: tasksWithCounts,
      totalItems,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate('assignees', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name key color members')
      .populate('board', 'name columns');

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const commentCount = await Comment.countDocuments({ task: taskId });

    return ApiResponse.success(res, 'Task retrieved successfully', {
      task: {
        ...task.toObject(),
        commentCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const oldStatus = task.status;
    const oldPriority = task.priority;
    const oldAssignees = task.assignees.map((a) => a.toString());

    // Apply allowed updates
    const allowedFields = [
      'title',
      'description',
      'status',
      'columnId',
      'priority',
      'dueDate',
      'assignees',
      'tags',
      'subtasks',
      'order',
      'estimatedHours',
      'loggedHours',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        task[field] = updates[field];
      }
    });

    // Automatically sync columnId when status is changed without explicit columnId
    if (updates.status && !updates.columnId) {
      const statusToColumnMap = {
        todo: 'col-todo',
        'in-progress': 'col-inprogress',
        review: 'col-review',
        done: 'col-done',
      };
      task.columnId = statusToColumnMap[updates.status] || `col-${updates.status}`;
    }

    await task.save();

    // Log relevant activity events
    if (updates.status && updates.status !== oldStatus) {
      await logActivity({
        project: task.project,
        board: task.board,
        task: task._id,
        user: req.user._id,
        action: 'TASK_STATUS_CHANGED',
        details: `${req.user.name} moved task "${task.title}" to ${updates.status.toUpperCase()}`,
        meta: { from: oldStatus, to: updates.status },
      });
    }

    if (updates.priority && updates.priority !== oldPriority) {
      await logActivity({
        project: task.project,
        board: task.board,
        task: task._id,
        user: req.user._id,
        action: 'TASK_PRIORITY_CHANGED',
        details: `${req.user.name} changed priority of "${task.title}" to ${updates.priority.toUpperCase()}`,
        meta: { from: oldPriority, to: updates.priority },
      });
    }

    if (updates.assignees) {
      const newAssignees = updates.assignees.map((a) => a.toString());
      const added = newAssignees.filter((a) => !oldAssignees.includes(a));
      if (added.length > 0) {
        const addedUsers = await User.find({ _id: { $in: added } }).select('name');
        const names = addedUsers.map((u) => u.name).join(', ');
        await logActivity({
          project: task.project,
          board: task.board,
          task: task._id,
          user: req.user._id,
          action: 'TASK_ASSIGNED',
          details: `${req.user.name} assigned ${names} to "${task.title}"`,
        });
      }
    }

    const updatedTask = await Task.findById(taskId)
      .populate('assignees', 'name email avatar')
      .populate('creator', 'name email avatar');

    const commentCount = await Comment.countDocuments({ task: taskId });

    return ApiResponse.success(res, 'Task updated successfully', {
      task: {
        ...updatedTask.toObject(),
        commentCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status, columnId, order } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const oldStatus = task.status;
    task.status = status;
    if (columnId) task.columnId = columnId;
    if (order !== undefined) task.order = order;

    await task.save();

    if (status !== oldStatus) {
      await logActivity({
        project: task.project,
        board: task.board,
        task: task._id,
        user: req.user._id,
        action: 'TASK_STATUS_CHANGED',
        details: `${req.user.name} moved "${task.title}" from ${oldStatus.toUpperCase()} to ${status.toUpperCase()}`,
        meta: { from: oldStatus, to: status },
      });
    }

    const populatedTask = await Task.findById(taskId)
      .populate('assignees', 'name email avatar')
      .populate('creator', 'name email avatar');

    return ApiResponse.success(res, 'Task status updated successfully', { task: populatedTask });
  } catch (error) {
    next(error);
  }
};

export const reorderTasks = async (req, res, next) => {
  try {
    const { taskId, destinationStatus, newOrder, columnId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const oldStatus = task.status;
    task.status = destinationStatus;
    task.order = newOrder;
    if (columnId) task.columnId = columnId;

    await task.save();

    if (oldStatus !== destinationStatus) {
      await logActivity({
        project: task.project,
        board: task.board,
        task: task._id,
        user: req.user._id,
        action: 'TASK_STATUS_CHANGED',
        details: `${req.user.name} moved "${task.title}" to ${destinationStatus.toUpperCase()}`,
        meta: { from: oldStatus, to: destinationStatus },
      });
    }

    return ApiResponse.success(res, 'Task reordered successfully', { task });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    await Comment.deleteMany({ task: taskId });
    await Task.findByIdAndDelete(taskId);

    await logActivity({
      project: task.project,
      board: task.board,
      user: req.user._id,
      action: 'TASK_DELETED',
      details: `${req.user.name} deleted task "${task.title}"`,
    });

    return ApiResponse.success(res, 'Task and associated comments deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getTaskActivity = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const activities = await ActivityLog.find({ task: taskId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    return ApiResponse.success(res, 'Task activity history retrieved', { activities });
  } catch (error) {
    next(error);
  }
};
