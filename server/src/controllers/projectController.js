import Project from '../models/projectModel.js';
import Board from '../models/boardModel.js'
import Task from '../models/taskModel.js';

const DEFAULT_COLUMNS = [
  { name: 'To Do', color: '#6b7590', order: 0, isDefault: true },
  { name: 'In Progress', color: '#4f8ef7', order: 1 },
  { name: 'Review', color: '#f5a623', order: 2 },
  { name: 'Done', color: '#22d3a0', order: 3 },
];

// GET /api/projects?workspace=id
export const getProjects = async (req, res, next) => {
  try {
    const { workspace } = req.query;
    const query = {
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      isArchived: false,
    };
    if (workspace) query.workspace = workspace;

    const projects = await Project.find(query)
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar')
      .lean();

    res.json({ projects });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
export const createProject = async (req, res, next) => {
  try {
    const { name, description, workspace, color, startDate, endDate, template } = req.body;
    if (!name || !workspace) return res.status(400).json({ error: 'Name and workspace required' });

    const project = await Project.create({
      name, description, workspace, color, startDate, endDate,
      template: template || 'custom',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'project_manager' }],
    });

    // Create default board with columns
    await Board.create({
      project: project._id,
      workspace,
      columns: DEFAULT_COLUMNS,
    });

    await project.populate('owner', 'name avatar');
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email isOnline');

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:id
export const updateProject = async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'color', 'status', 'startDate', 'endDate', 'defaultView'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar');

    res.json({ project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id (archive)
export const archiveProject = async (req, res, next) => {
  try {
    await Project.findByIdAndUpdate(req.params.id, { isArchived: true, status: 'archived' });
    res.json({ message: 'Project archived' });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id/stats
export const getProjectStats = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const [total, byStatus, overdue, byPriority] = await Promise.all([
      Task.countDocuments({ project: projectId, isArchived: false }),
      Task.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId(projectId), isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({
        project: projectId,
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' },
        isArchived: false,
      }),
      Task.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId(projectId), isArchived: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({ total, byStatus, overdue, byPriority });
  } catch (err) {
    next(err);
  }
};