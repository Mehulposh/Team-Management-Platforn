import Sprint from '../models/sprintModel.js';
import Task from '../models/taskModel.js';

export const getSprints = async (req, res, next) => {
  try {
    const { project } = req.query;
    const sprints = await Sprint.find({ project, ...( req.query.status ? { status: req.query.status } : {}) })
      .sort({ startDate: -1 });
    res.json({ sprints });
  } catch (err) { next(err); }
};

export const createSprint = async (req, res, next) => {
  try {
    const { name, goal, project, workspace, startDate, endDate, capacity } = req.body;
    const sprint = await Sprint.create({ name, goal, project, workspace, startDate, endDate, capacity: capacity || 0 });
    res.status(201).json({ sprint });
  } catch (err) { next(err); }
};

export const getSprint = async (req, res, next) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const tasks = await Task.find({ sprint: sprint._id, isArchived: false })
      .populate('assignees', 'name avatar')
      .populate('creator', 'name avatar');

    const completedPoints = tasks.filter(t => t.status === 'done').reduce((s, t) => s + t.storyPoints, 0);
    const totalPoints = tasks.reduce((s, t) => s + t.storyPoints, 0);

    res.json({ sprint, tasks, completedPoints, totalPoints });
  } catch (err) { next(err); }
};

export const updateSprint = async (req, res, next) => {
  try {
    const allowed = ['name', 'goal', 'startDate', 'endDate', 'status', 'capacity', 'retrospective'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.status === 'active') {
      const existing = await Sprint.findOne({ project: req.body.project, status: 'active' });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(400).json({ error: 'Another sprint is already active' });
      }
    }

    if (updates.status === 'completed') {
      updates.completedAt = new Date();
      // Record final velocity
      const tasks = await Task.find({ sprint: req.params.id, status: 'done' });
      updates.velocity = tasks.reduce((s, t) => s + t.storyPoints, 0);
    }

    const sprint = await Sprint.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ sprint });
  } catch (err) { next(err); }
};

export const deleteSprint = async (req, res, next) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });
    if (sprint.status === 'active') return res.status(400).json({ error: 'Cannot delete active sprint' });

    await Task.updateMany({ sprint: sprint._id }, { $set: { sprint: null } });
    await sprint.deleteOne();
    res.json({ message: 'Sprint deleted, tasks moved to backlog' });
  } catch (err) { next(err); }
};

export const getBurndown = async (req, res, next) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const tasks = await Task.find({ sprint: sprint._id });
    const total = tasks.reduce((s, t) => s + (t.storyPoints || 0), 0);

    // Ideal burndown: linear from total to 0 over sprint duration
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    const ideal = Array.from({ length: days + 1 }, (_, i) => ({
      day: i,
      date: new Date(start.getTime() + i * 86400000).toISOString().split('T')[0],
      ideal: Math.round(total * (1 - i / days)),
    }));

    res.json({ sprint, burndown: sprint.burndownData, ideal, total });
  } catch (err) { next(err); }
};