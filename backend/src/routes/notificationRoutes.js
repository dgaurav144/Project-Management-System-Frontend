import { Router } from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.delete('/clear', clearNotifications);
router.patch('/:notificationId/read', markAsRead);

export default router;
