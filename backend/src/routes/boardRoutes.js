import { Router } from 'express';
import {
  createBoard,
  getBoardsByProject,
  getBoardById,
  updateBoard,
  deleteBoard,
} from '../controllers/boardController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireProjectPermission } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createBoardSchema, updateBoardSchema } from '../utils/validators.js';

const router = Router();

router.use(authenticate);

// Boards nested under projects
router.get('/project/:projectId', requireProjectPermission('viewTasks'), getBoardsByProject);
router.post('/project/:projectId', requireProjectPermission('manageBoards'), validate(createBoardSchema), createBoard);

// Board specific operations
router.get('/:boardId', requireProjectPermission('viewTasks'), getBoardById);
router.patch('/:boardId', requireProjectPermission('manageBoards'), validate(updateBoardSchema), updateBoard);
router.delete('/:boardId', requireProjectPermission('manageBoards'), deleteBoard);

export default router;
