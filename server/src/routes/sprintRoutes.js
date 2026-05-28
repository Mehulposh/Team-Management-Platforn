import express from 'express';
const router = express.Router();
import { getSprints, createSprint, getSprint, updateSprint, deleteSprint, getBurndown } from '../controllers/sprintController.js';
import { protect } from '../middleware/authMiddleware.js';

router.use(protect);
router.get('/', getSprints);
router.post('/', createSprint);
router.get('/:id', getSprint);
router.patch('/:id', updateSprint);
router.delete('/:id', deleteSprint);
router.get('/:id/burndown', getBurndown);

export default router;