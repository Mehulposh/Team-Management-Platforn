import Task from '../models/taskModel.js';
import Board from '../models/boardModel.js';
import { emitTaskUpdate } from '../socket/index.js';
import { createNotification } from '../middleware/notification.js';
import User from '../models/userModel.js';

// GET /api/tasks?project=id&column=id&sprint=id
export const getTasks = async (req, res, next) => {
  try {
    const { project, columnId, sprint, assignee, priority, status, search, page = 1, limit = 50 } = req.query;
    const query = { isArchived: false };

    if (project) query.project = project;
    if (columnId) query.columnId = columnId;
    if (sprint) query.sprint = sprint;
    if (assignee) query.assignees = assignee;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(query)
      .populate('assignees', 'name avatar email')
      .populate('creator', 'name avatar')
      .populate('sprint', 'name')
      .sort({ order: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id
export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name avatar email')
      .populate('creator', 'name avatar')
      .populate('sprint', 'name startDate endDate')
      .populate('activity.user', 'name avatar')
      .populate('watchers', 'name avatar');

    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks
export const createTask = async (req, res, next) => {
  try {
    const {
      title, description, project, workspace, board, columnId,
      sprint, assignees, priority, dueDate, startDate, labels,
      estimatedHours, storyPoints,
    } = req.body;

    // Get next order
    const maxOrder = await Task.findOne({ board, columnId }).sort({ order: -1 }).select('order');

    const task = await Task.create({
      title,
      description,
      project,
      workspace,
      board,
      columnId,
      sprint: sprint || null,
      assignees: assignees || [],
      priority: priority || 'medium',
      dueDate,
      startDate,
      labels: labels || [],
      estimatedHours: estimatedHours || 0,
      storyPoints: storyPoints || 0,
      creator: req.user._id,
      order: maxOrder ? maxOrder.order + 1 : 0,
      activity: [{
        user: req.user._id,
        action: 'created',
        message: 'created this task',
      }],
    });

    const populated = await task.populate([
      { path: 'assignees', select: 'name avatar email' },
      { path: 'creator', select: 'name avatar' },
    ]);

    // Notify assignees
    if (assignees?.length) {
      const users = await User.find({ _id: { $in: assignees } });
      for (const assignee of users) {
        if (assignee._id.toString() !== req.user._id.toString()) {
          await createNotification({
            recipient: assignee._id,
            sender: req.user._id,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `${req.user.name} assigned you: "${title}"`,
            link: `/projects/${project}/tasks/${task._id}`,
            workspace,
            project,
            task: task._id,
          });
        }
      }
    }

    emitTaskUpdate(project, 'task:created', { task: populated });
    res.status(201).json({ task: populated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const allowedFields = [
      'title', 'description', 'columnId', 'priority', 'status',
      'dueDate', 'startDate', 'labels', 'estimatedHours', 'loggedHours',
      'storyPoints', 'sprint',
    ];

    const changes = [];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== task[field]) {
        changes.push({ field, oldValue: task[field], newValue: req.body[field] });
        task[field] = req.body[field];
      }
    }

    // Track status completion
    if (req.body.status === 'done' && task.status !== 'done') {
      task.completedAt = new Date();
    }

    // Activity log
    if (changes.length) {
      changes.forEach(c => {
        task.activity.push({
          user: req.user._id,
          action: 'updated',
          field: c.field,
          oldValue: c.oldValue,
          newValue: c.newValue,
          message: `changed ${c.field}`,
        });
      });
    }

    await task.save();

    const populated = await task.populate([
      { path: 'assignees', select: 'name avatar email' },
      { path: 'creator', select: 'name avatar' },
    ]);

    emitTaskUpdate(task.project, 'task:updated', { task: populated });
    res.json({ task: populated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id/assignees
export const updateAssignees = async (req, res, next) => {
  try {
    const { assignees } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const previousAssignees = task.assignees.map(a => a.toString());
    task.assignees = assignees;
    task.activity.push({
      user: req.user._id,
      action: 'assigned',
      message: `updated assignees`,
    });
    await task.save();

    // Notify new assignees
    const newAssignees = assignees.filter(id => !previousAssignees.includes(id.toString()));
    const users = await User.find({ _id: { $in: newAssignees } });
    for (const user of users) {
      if (user._id.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: user._id,
          sender: req.user._id,
          type: 'task_assigned',
          title: 'Task Assigned',
          message: `${req.user.name} assigned you: "${task.title}"`,
          link: `/projects/${task.project}/tasks/${task._id}`,
          workspace: task.workspace,
          project: task.project,
          task: task._id,
        });
      }
    }

    const populated = await task.populate('assignees', 'name avatar email');
    emitTaskUpdate(task.project.toString(), 'task:updated', { task: populated });
    res.json({ task: populated });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks/reorder — bulk reorder after drag-drop
export const reorderTasks = async (req, res, next) => {
  try {
    const { projectId, moves } = req.body;
    // moves: [{ taskId, columnId, order }]

    const bulkOps = moves.map(move => ({
      updateOne: {
        filter: { _id: move.taskId },
        update: { $set: { columnId: move.columnId, order: move.order } },
      },
    }));

    await Task.bulkWrite(bulkOps);
    emitTaskUpdate(projectId, 'board:reordered', { moves });
    res.json({ message: 'Board updated' });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks/:id/subtasks
export const addSubtask = async (req, res, next) => {
  try {
    const { title } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.subtasks.push({ title });
    task.activity.push({ user: req.user._id, action: 'updated', message: `added subtask: "${title}"` });
    await task.save();

    emitTaskUpdate(task.project.toString(), 'task:updated', { task });
    res.json({ task });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id/subtasks/:subtaskId
export const toggleSubtask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    subtask.isCompleted = !subtask.isCompleted;
    subtask.completedAt = subtask.isCompleted ? new Date() : undefined;
    subtask.completedBy = subtask.isCompleted ? req.user._id : undefined;
    await task.save();

    emitTaskUpdate(task.project.toString(), 'task:updated', { task });
    res.json({ task });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await task.deleteOne();
    emitTaskUpdate(task.project.toString(), 'task:deleted', { taskId: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};