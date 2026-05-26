import Workspace from '../models/workspaceModel.js';
import User from '../models/userModel.js';
import Project from '../models/projectModel.js';
import { generateRandomToken } from '../middleware/token.js';
import { sendWorkspaceInviteEmail } from '../middleware/email.js';

// GET /api/workspaces — user's workspaces
export const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ],
      isArchived: false,
    }).populate('owner', 'name avatar').lean();

    res.json({ workspaces });
  } catch (err) {
    next(err);
  }
};

// POST /api/workspaces
export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Workspace name is required' });

    const workspace = await Workspace.create({
      name,
      description,
      color: color || '#4f8ef7',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    await workspace.populate('owner', 'name avatar');
    res.status(201).json({ workspace });
  } catch (err) {
    next(err);
  }
};

// GET /api/workspaces/:workspaceId
export const getWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email isOnline lastSeen');

    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    res.json({ workspace });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/workspaces/:workspaceId
export const updateWorkspace = async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'color', 'logo', 'settings'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const workspace = await Workspace.findByIdAndUpdate(
      req.params.workspaceId,
      updates,
      { new: true, runValidators: true }
    ).populate('owner', 'name avatar').populate('members.user', 'name avatar email');

    res.json({ workspace });
  } catch (err) {
    next(err);
  }
};

// POST /api/workspaces/:workspaceId/invite
export const inviteMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    // Check if already a member
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const isMember = workspace.members.some(m => m.user.toString() === existingUser._id.toString());
      if (isMember) return res.status(409).json({ error: 'User is already a member' });
    }

    const token = generateRandomToken();
    workspace.invites.push({
      email: email.toLowerCase(),
      role,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedBy: req.user._id,
    });

    await workspace.save();
    await sendWorkspaceInviteEmail(email, req.user.name, workspace.name, token);

    res.json({ message: 'Invitation sent' });
  } catch (err) {
    next(err);
  }
};

// POST /api/workspaces/accept-invite
export const acceptInvite = async (req, res, next) => {
  try {
    const { token } = req.body;
    const workspace = await Workspace.findOne({
      'invites.token': token,
      'invites.expiresAt': { $gt: new Date() },
    });

    if (!workspace) return res.status(400).json({ error: 'Invalid or expired invite' });

    const invite = workspace.invites.find(i => i.token === token);
    if (invite.email !== req.user.email) {
      return res.status(403).json({ error: 'This invite is for a different email address' });
    }

    const alreadyMember = workspace.members.some(m => m.user.toString() === req.user._id.toString());
    if (!alreadyMember) {
      workspace.members.push({ user: req.user._id, role: invite.role });
    }

    workspace.invites = workspace.invites.filter(i => i.token !== token);
    await workspace.save();

    res.json({ workspace, message: 'Successfully joined workspace' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/workspaces/:workspaceId/members/:userId
export const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const member = workspace.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    member.role = role;
    await workspace.save();
    res.json({ message: 'Role updated' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/workspaces/:workspaceId/members/:userId
export const removeMember = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    if (workspace.owner.toString() === req.params.userId) {
      return res.status(400).json({ error: 'Cannot remove workspace owner' });
    }

    workspace.members = workspace.members.filter(m => m.user.toString() !== req.params.userId);
    await workspace.save();
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
};