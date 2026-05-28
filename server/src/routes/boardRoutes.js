// routes/boards.js
import express from 'express';
const router = express.Router();
import { getBoardByProject, addColumn, updateColumn, deleteColumn, reorderColumns } from '../controllers/boardController.js';
import { protect } from '../middleware/authMiddleware.js';

router.use(protect);
router.get('/project/:projectId', getBoardByProject);
router.post('/:boardId/columns', addColumn);
router.patch('/:boardId/columns/reorder', reorderColumns);
router.patch('/:boardId/columns/:columnId', updateColumn);
router.delete('/:boardId/columns/:columnId', deleteColumn);

export default router;