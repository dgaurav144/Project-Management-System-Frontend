import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      default: null,
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'TASK_CREATED',
        'TASK_UPDATED',
        'TASK_STATUS_CHANGED',
        'TASK_PRIORITY_CHANGED',
        'TASK_ASSIGNED',
        'TASK_UNASSIGNED',
        'TASK_DELETED',
        'COMMENT_ADDED',
        'COMMENT_DELETED',
        'MEMBER_INVITED',
        'MEMBER_ROLE_UPDATED',
        'MEMBER_REMOVED',
        'PROJECT_CREATED',
        'PROJECT_UPDATED',
        'PROJECT_STATUS_CHANGED',
        'PROJECT_DELETED',
        'PERMISSIONS_UPDATED',
        'BOARD_CREATED',
      ],
    },
    details: {
      type: String,
      required: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
