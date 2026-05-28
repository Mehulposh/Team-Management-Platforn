import express from 'express';
const router = express.Router();
import {
  getTasks, getTask, createTask, updateTask, deleteTask,
  reorderTasks, addSubtask, toggleSubtask, updateAssignees,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

router.use(protect);
router.get('/', getTasks);
router.post('/', createTask);
router.post('/reorder', reorderTasks);
router.get('/:id', getTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/assignees', updateAssignees);
router.post('/:id/subtasks', addSubtask);
router.patch('/:id/subtasks/:subtaskId', toggleSubtask);

export default router;