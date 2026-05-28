import express from 'express';
const router = express.Router();
import { getNotifications, markRead, markAllRead, deleteNotification } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

router.use(protect);
router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/:id', deleteNotification);

export default router;