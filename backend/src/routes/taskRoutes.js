import { Router } from 'express';
import {
  createTask,
  getTasksByBoard,
  getTaskById,
  updateTask,
  updateTaskStatus,
  reorderTasks,
  deleteTask,
  getTaskActivity,
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireProjectPermission } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  reorderTaskSchema,
} from '../utils/validators.js';

const router = Router();

router.use(authenticate);

// Board-scoped task listing & creation
router.get('/board/:boardId', requireProjectPermission('viewTasks'), getTasksByBoard);
router.post('/board/:boardId', requireProjectPermission('createTasks'), validate(createTaskSchema), createTask);

// Task reordering for Kanban drag-and-drop
router.post('/reorder', requireProjectPermission('moveTasks'), validate(reorderTaskSchema), reorderTasks);

// Task individual operations
router.get('/:taskId', requireProjectPermission('viewTasks'), getTaskById);
router.patch('/:taskId', requireProjectPermission('editTasks'), validate(updateTaskSchema), updateTask);
router.patch('/:taskId/status', requireProjectPermission('moveTasks'), updateTaskStatus);
router.delete('/:taskId', requireProjectPermission('deleteTasks'), deleteTask);

// Task activity audit history
router.get('/:taskId/activity', requireProjectPermission('viewTasks'), getTaskActivity);

export default router;
