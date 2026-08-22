import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({
  project,
  board = null,
  task = null,
  user,
  action,
  details,
  meta = {},
}) => {
  try {
    const activity = await ActivityLog.create({
      project,
      board,
      task,
      user,
      action,
      details,
      meta,
    });
    return activity;
  } catch (error) {
    console.error('[ActivityLog] Failed to record activity:', error.message);
    return null;
  }
};
