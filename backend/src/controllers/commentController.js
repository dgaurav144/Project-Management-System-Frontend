import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { logActivity } from '../utils/activityLogger.js';

export const createComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content, mentions = [] } = req.body;

    const task = await Task.findById(taskId).populate('project', 'name key');
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // Auto-detect @mentions by parsing '@Name' patterns if not explicitly passed
    let finalMentions = Array.isArray(mentions) ? [...mentions] : [];

    const comment = await Comment.create({
      task: taskId,
      project: task.project._id || task.project,
      user: req.user._id,
      content,
      mentions: finalMentions,
    });

    // Populate user and mentions for response
    const populated = await Comment.findById(comment._id)
      .populate('user', 'name email avatar')
      .populate('mentions', 'name email avatar');

    // Create In-App Notifications for every mentioned user
    if (finalMentions.length > 0) {
      const mentionNotifications = finalMentions
        .filter((uid) => uid.toString() !== req.user._id.toString())
        .map((recipientId) => ({
          recipient: recipientId,
          sender: req.user._id,
          project: task.project._id || task.project,
          task: task._id,
          type: 'MENTION',
          title: `${req.user.name} tagged you in a comment`,
          message: content.length > 100 ? `${content.substring(0, 100)}...` : content,
        }));

      if (mentionNotifications.length > 0) {
        await Notification.insertMany(mentionNotifications);
      }
    }

    // Also notify task creator/assignees if they didn't write the comment and weren't already tagged
    const otherRecipients = [task.creator, ...(task.assignees || [])]
      .filter(Boolean)
      .map((id) => id.toString())
      .filter((id) => id !== req.user._id.toString() && !finalMentions.includes(id));

    const uniqueOtherRecipients = [...new Set(otherRecipients)];
    if (uniqueOtherRecipients.length > 0) {
      const commentNotifs = uniqueOtherRecipients.map((recipientId) => ({
        recipient: recipientId,
        sender: req.user._id,
        project: task.project._id || task.project,
        task: task._id,
        type: 'COMMENT',
        title: `${req.user.name} commented on "${task.title}"`,
        message: content.length > 100 ? `${content.substring(0, 100)}...` : content,
      }));
      await Notification.insertMany(commentNotifs);
    }

    // Audit log
    await logActivity({
      project: task.project._id || task.project,
      board: task.board,
      task: task._id,
      user: req.user._id,
      action: 'COMMENT_ADDED',
      details: `${req.user.name} commented on "${task.title}"`,
    });

    return ApiResponse.created(res, 'Comment posted successfully', { comment: populated });
  } catch (error) {
    next(error);
  }
};

export const getCommentsByTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.find({ task: taskId })
      .populate('user', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .sort({ createdAt: 1 });

    return ApiResponse.success(res, 'Comments retrieved successfully', { comments });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }

    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only edit your own comments');
    }

    comment.content = content;
    comment.isEdited = true;
    await comment.save();

    const populated = await Comment.findById(comment._id)
      .populate('user', 'name email avatar')
      .populate('mentions', 'name email avatar');

    return ApiResponse.success(res, 'Comment updated successfully', { comment: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }

    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only delete your own comments');
    }

    await Comment.findByIdAndDelete(commentId);

    return ApiResponse.success(res, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
};
