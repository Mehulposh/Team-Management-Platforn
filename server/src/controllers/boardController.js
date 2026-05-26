import Board from '../models/boardModel.js';
import Task from '../models/taskModel.js';
import { emitTaskUpdate } from '../socket/index.js';

// GET /api/boards/project/:projectId
export const getBoardByProject = async (req, res, next) => {
  try {
    const board = await Board.findOne({ project: req.params.projectId });
    if (!board) return res.status(404).json({ error: 'Board not found' });

    // Get tasks grouped by column
    const tasks = await Task.find({ board: board._id, isArchived: false })
      .populate('assignees', 'name avatar')
      .populate('creator', 'name avatar')
      .sort({ order: 1 });

    // Group by columnId
    const tasksByColumn = {};
    board.columns.forEach(col => {
      tasksByColumn[col._id.toString()] = [];
    });
    tasks.forEach(task => {
      const colId = task.columnId.toString();
      if (tasksByColumn[colId]) {
        tasksByColumn[colId].push(task);
      }
    });

    res.json({ board, tasks: tasksByColumn });
  } catch (err) {
    next(err);
  }
};

// POST /api/boards/:boardId/columns
export const addColumn = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const maxOrder = board.columns.reduce((max, c) => Math.max(max, c.order), -1);
    board.columns.push({ name, color: color || '#6b7590', order: maxOrder + 1 });
    await board.save();

    emitTaskUpdate(board.project.toString(), 'board:column_added', { columns: board.columns });
    res.json({ board });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/boards/:boardId/columns/:columnId
export const updateColumn = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const column = board.columns.id(req.params.columnId);
    if (!column) return res.status(404).json({ error: 'Column not found' });

    if (req.body.name) column.name = req.body.name;
    if (req.body.color) column.color = req.body.color;
    if (req.body.wipLimit !== undefined) column.wipLimit = req.body.wipLimit;

    await board.save();
    emitTaskUpdate(board.project.toString(), 'board:column_updated', { columns: board.columns });
    res.json({ board });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/boards/:boardId/columns/:columnId
export const deleteColumn = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const taskCount = await Task.countDocuments({ board: board._id, columnId: req.params.columnId });
    if (taskCount > 0) {
      return res.status(400).json({ error: `Column has ${taskCount} tasks. Move or delete them first.` });
    }

    board.columns = board.columns.filter(c => c._id.toString() !== req.params.columnId);
    await board.save();

    emitTaskUpdate(board.project.toString(), 'board:column_deleted', { columnId: req.params.columnId });
    res.json({ board });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/boards/:boardId/columns/reorder
export const reorderColumns = async (req, res, next) => {
  try {
    const { orderedIds } = req.body; // array of column IDs in new order
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    orderedIds.forEach((id, index) => {
      const col = board.columns.id(id);
      if (col) col.order = index;
    });

    board.columns.sort((a, b) => a.order - b.order);
    await board.save();

    emitTaskUpdate(board.project.toString(), 'board:column_reordered', { columns: board.columns });
    res.json({ board });
  } catch (err) {
    next(err);
  }
};