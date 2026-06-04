import express from 'express';
const router = express.Router();
import {
  getWorkspaces, createWorkspace, getWorkspace, updateWorkspace,
  inviteMember, acceptInvite, updateMemberRole, removeMember, addMemberDirect
} from '../controllers/workspaceController.js';
import { protect, workspaceMember, requireRole } from '../middleware/authMiddleware.js';



router.use(protect);
router.get('/', getWorkspaces);
router.post('/', createWorkspace);
router.post('/accept-invite', acceptInvite);

router.get('/:workspaceId', workspaceMember, getWorkspace);
router.patch('/:workspaceId', workspaceMember, requireRole('admin'), updateWorkspace);

// Direct add (no email needed) — admin/PM only
router.post('/:workspaceId/add-member', workspaceMember, requireRole('admin', 'project_manager'), addMemberDirect);

// Email invite — admin/PM only
router.post('/:workspaceId/invite', workspaceMember, requireRole('admin', 'project_manager'), inviteMember);

router.patch('/:workspaceId/members/:userId', workspaceMember, requireRole('admin'), updateMemberRole);
router.delete('/:workspaceId/members/:userId', workspaceMember, requireRole('admin'), removeMember);


export default router;