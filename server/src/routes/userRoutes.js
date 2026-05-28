// routes/users.js
import express from 'express';
const router = express.Router();
import { getMe, updateMe, changePassword, searchUsers, getUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

router.use(protect);
router.get('/me', getMe);
router.patch('/me', updateMe);
router.patch('/me/password', changePassword);
router.get('/search', searchUsers);
router.get('/:id', getUser);

export default router;