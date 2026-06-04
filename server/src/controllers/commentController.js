import Comment from '../models/commentModel.js';
import Task from '../models/taskModel.js';
import { createNotification } from '../middleware/notification.js';
import User from '../models/userModel.js';

// GET /api/comments?task=id
export const getComments = async (req, res, next) => {
  try {
    const { task } = req.query;
    const comments = await Comment.find({ 
      task, 
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }  // Comments where isDeleted field doesn't exist
      ] 
    })
      .populate('author', 'name avatar')
      .populate('mentions', 'name avatar')
      .populate({ path: 'parentComment', populate: { path: 'author', select: 'name avatar' } })
      .sort({ createdAt: 1 });
    
    res.json({ comments });
  } catch (err) { next(err); }
};

// POST /api/comments
export const createComment = async (req, res, next) => {
  try {
    const { task: taskId, content, mentions, parentComment } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      content,
      mentions: mentions || [],
      parentComment: parentComment || null,
    });

    // Activity on task
    task.activity.push({ user: req.user._id, action: 'commented', message: 'added a comment' });
    await task.save();

    const populated = await comment.populate([
      { path: 'author', select: 'name avatar' },
      { path: 'mentions', select: 'name avatar' },
    ]);

    // Notify mentioned users
    if (mentions?.length) {
      const users = await User.find({ _id: { $in: mentions } });
      for (const user of users) {
        if (user._id.toString() !== req.user._id.toString()) {
          await createNotification({
            recipient: user._id,
            sender: req.user._id,
            type: 'task_mentioned',
            title: 'You were mentioned',
            message: `${req.user.name} mentioned you in "${task.title}"`,
            link: `/projects/${task.project}/tasks/${task._id}`,
            workspace: task.workspace,
            project: task.project,
            task: task._id,
          });
        }
      }
    }

    // Notify task watchers
    for (const watcherId of task.watchers) {
      if (watcherId.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: watcherId,
          sender: req.user._id,
          type: 'task_commented',
          title: 'New comment',
          message: `${req.user.name} commented on "${task.title}"`,
          link: `/projects/${task.project}/tasks/${task._id}`,
          workspace: task.workspace,
          project: task.project,
          task: task._id,
        });
      }
    }

    res.status(201).json({ comment: populated });
  } catch (err) { next(err); }
};

// PATCH /api/comments/:id
export const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    const populated = await comment.populate('author', 'name avatar');
    res.json({ comment: populated });
  } catch (err) { next(err); }
};

// DELETE /api/comments/:id
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    comment.isDeleted = true;
    comment.content = '[deleted]';
    await comment.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) { next(err); }
};

// POST /api/comments/:id/react
export const reactToComment = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const reaction = comment.reactions.find(r => r.emoji === emoji);
    if (reaction) {
      const idx = reaction.users.indexOf(req.user._id);
      if (idx > -1) reaction.users.splice(idx, 1);
      else reaction.users.push(req.user._id);
      if (reaction.users.length === 0) {
        comment.reactions = comment.reactions.filter(r => r.emoji !== emoji);
      }
    } else {
      comment.reactions.push({ emoji, users: [req.user._id] });
    }

    await comment.save();
    res.json({ reactions: comment.reactions });
  } catch (err) { next(err); }
};