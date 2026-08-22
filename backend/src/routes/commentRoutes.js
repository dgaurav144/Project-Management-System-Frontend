import { Router } from 'express';
import {
  createComment,
  getCommentsByTask,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireProjectPermission } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createCommentSchema } from '../utils/validators.js';

const router = Router();

router.use(authenticate);

// Task comments
router.get('/task/:taskId', requireProjectPermission('viewTasks'), getCommentsByTask);
router.post('/task/:taskId', requireProjectPermission('createComments'), validate(createCommentSchema), createComment);

// Comment modification
router.patch('/:commentId', validate(createCommentSchema), updateComment);
router.delete('/:commentId', deleteComment);

export default router;
