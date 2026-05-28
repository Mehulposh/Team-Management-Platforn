import express from 'express';
const router = express.Router();
import {
  getProjects, createProject, getProject, updateProject,
  archiveProject, getProjectStats,
} from '../controllers/projectController.js';
import { protect, projectMember } from '../middleware/authMiddleware.js';

router.use(protect);
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', projectMember, getProject);
router.patch('/:id', projectMember, updateProject);
router.delete('/:id', projectMember, archiveProject);
router.get('/:id/stats', projectMember, getProjectStats);

export default router;