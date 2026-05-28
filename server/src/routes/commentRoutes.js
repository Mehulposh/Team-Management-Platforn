import express from 'express';
const router = express.Router();
import { getComments, createComment, updateComment, deleteComment, reactToComment } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

router.use(protect);
router.get('/', getComments);
router.post('/', createComment);
router.patch('/:id', updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/react', reactToComment);

export default router;