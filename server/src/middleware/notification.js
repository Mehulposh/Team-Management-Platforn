import Notification from '../models/notificationModel.js';
import { getIO } from '../socket/index.js';

export const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  link,
  workspace,
  project,
  task,
}) => {
  try {
    const notification = await Notification.create({
      recipient, sender, type, title, message, link, workspace, project, task,
    });

    // Populate and emit via Socket.IO
    const populated = await notification.populate([
      { path: 'sender', select: 'name avatar' },
    ]);

    const io = getIO();
    if (io) {
      io.to(`user:${recipient}`).emit('notification:new', populated);
    }

    return populated;
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

export const notifyTaskAssigned = async ({ task, assignee, assigner }) => {
  return  createNotification({
    recipient: assignee._id,
    sender: assigner._id,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `${assigner.name} assigned you: "${task.title}"`,
    link: `/projects/${task.project}/tasks/${task._id}`,
    workspace: task.workspace,
    project: task.project,
    task: task._id,
  });
};

export const notifyMention = async ({ task, mentionedUser, mentioner }) => {
  return  createNotification({
    recipient: mentionedUser._id,
    sender: mentioner._id,
    type: 'task_mentioned',
    title: 'You were mentioned',
    message: `${mentioner.name} mentioned you in "${task.title}"`,
    link: `/projects/${task.project}/tasks/${task._id}`,
    workspace: task.workspace,
    project: task.project,
    task: task._id,
  });
};