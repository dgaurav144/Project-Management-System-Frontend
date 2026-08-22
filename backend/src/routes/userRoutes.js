import { Router } from 'express';
import { searchUsers, getAllUsers, getUserById } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.get('/', getAllUsers);
router.get('/:userId', getUserById);

export default router;
