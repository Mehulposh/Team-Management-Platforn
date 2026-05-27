import Task from '../models/taskModel.js';
import Sprint from '../models/sprintModel.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';

// GET /api/analytics/project/:projectId
export const getProjectAnalytics = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const pid = mongoose.Types.ObjectId(projectId);
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      tasksByStatus,
      tasksByPriority,
      completedLast30,
      overdueCount,
      completionByDay,
      workloadByAssignee,
    ] = await Promise.all([
      // Tasks by status
      Task.aggregate([
        { $match: { project: pid, isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Tasks by priority
      Task.aggregate([
        { $match: { project: pid, isArchived: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      // Completed last 30 days
      Task.countDocuments({
        project: projectId,
        status: 'done',
        completedAt: { $gte: thirtyDaysAgo },
        isArchived: false,
      }),
      // Overdue
      Task.countDocuments({
        project: projectId,
        dueDate: { $lt: now },
        status: { $ne: 'done' },
        isArchived: false,
      }),
      // Completion trend: tasks completed per day (last 14 days)
      Task.aggregate([
        {
          $match: {
            project: pid,
            status: 'done',
            completedAt: { $gte: new Date(now - 14 * 86400000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Workload per assignee
      Task.aggregate([
        { $match: { project: pid, isArchived: false, status: { $ne: 'done' } } },
        { $unwind: '$assignees' },
        { $group: { _id: '$assignees', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            count: 1,
            name: '$user.name',
            avatar: '$user.avatar',
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      tasksByStatus,
      tasksByPriority,
      completedLast30,
      overdueCount,
      completionByDay,
      workloadByAssignee,
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/workspace/:workspaceId
export const getWorkspaceAnalytics = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const wid = mongoose.Types.ObjectId(workspaceId);

    const [totalTasks, completedTasks, totalSprints, activeSprint, velocityTrend] = await Promise.all([
      Task.countDocuments({ workspace: workspaceId, isArchived: false }),
      Task.countDocuments({ workspace: workspaceId, status: 'done', isArchived: false }),
      Sprint.countDocuments({ workspace: workspaceId }),
      Sprint.findOne({ workspace: workspaceId, status: 'active' }),
      // Sprint velocity trend
      Sprint.find({ workspace: workspaceId, status: 'completed' })
        .select('name velocity capacity completedAt')
        .sort({ completedAt: -1 })
        .limit(6),
    ]);

    res.json({
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalSprints,
      activeSprint,
      velocityTrend: velocityTrend.reverse(),
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/user — current user's personal stats
export const getUserAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const weekAgo = new Date(now - 7 * 86400000);

    const [myTasks, completedThisWeek, overdue, byPriority] = await Promise.all([
      Task.countDocuments({ assignees: userId, status: { $ne: 'done' }, isArchived: false }),
      Task.countDocuments({ assignees: userId, status: 'done', completedAt: { $gte: weekAgo } }),
      Task.countDocuments({
        assignees: userId,
        dueDate: { $lt: now },
        status: { $ne: 'done' },
        isArchived: false,
      }),
      Task.aggregate([
        { $match: { assignees: userId, isArchived: false, status: { $ne: 'done' } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({ myTasks, completedThisWeek, overdue, byPriority });
  } catch (err) { next(err); }
};