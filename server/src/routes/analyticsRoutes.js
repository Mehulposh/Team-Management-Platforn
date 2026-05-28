import express from 'express';
const router = express.Router();
import { getProjectAnalytics, getWorkspaceAnalytics, getUserAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

router.use(protect);
router.get('/project/:projectId', getProjectAnalytics);
router.get('/workspace/:workspaceId', getWorkspaceAnalytics);
router.get('/me', getUserAnalytics);

export default router;