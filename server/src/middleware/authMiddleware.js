import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Workspace from '../models/workspaceModel.js';
import Project from '../models/projectModel.js';

// Verify JWT and attach user to req
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    next(err);
  }
};

// Check workspace membership and attach role
export const workspaceMember = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspace;
    if (!workspaceId) return next();

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const member = workspace.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    const isOwner = workspace.owner.toString() === req.user._id.toString();

    if (!member && !isOwner) {
      return res.status(403).json({ error: 'Not a workspace member' });
    }

    req.workspace = workspace;
    req.workspaceRole = isOwner ? 'admin' : member.role;
    next();
  } catch (err) {
    next(err);
  }
};

// Require specific workspace roles
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.workspaceRole)) {
    return res.status(403).json({ error: `Role '${req.workspaceRole}' is not authorized` });
  }
  next();
};

// Check project membership
export const projectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    if (!projectId) return next();

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    const isOwner = project.owner.toString() === req.user._id.toString();

    if (!isMember && !isOwner) {
      return res.status(403).json({ error: 'Not a project member' });
    }

    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

// Global admin only
export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};