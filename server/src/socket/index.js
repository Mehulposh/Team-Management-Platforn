import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { Message, Channel } from '../models/chatModel.js';
import Task from '../models/taskModel.js';

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name avatar email');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: ${user.name} (${socket.id})`);

    // Join personal room for notifications
    socket.join(`user:${user._id}`);

    // Update online status
    await User.findByIdAndUpdate(user._id, { isOnline: true, lastSeen: new Date() });
    io.emit('user:online', { userId: user._id });

    // ─── WORKSPACE ────────────────────────────────────────
    socket.on('workspace:join', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
    });

    socket.on('workspace:leave', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    // ─── PROJECT / BOARD ──────────────────────────────────
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // ─── TASK EVENTS ──────────────────────────────────────
    socket.on('task:join', (taskId) => {
      socket.join(`task:${taskId}`);
    });

    socket.on('task:leave', (taskId) => {
      socket.leave(`task:${taskId}`);
    });

    // Typing indicator on task comment
    socket.on('task:typing', ({ taskId }) => {
      socket.to(`task:${taskId}`).emit('task:typing', {
        userId: user._id,
        name: user.name,
        avatar: user.avatar,
      });
    });

    socket.on('task:stop_typing', ({ taskId }) => {
      socket.to(`task:${taskId}`).emit('task:stop_typing', { userId: user._id });
    });

    // ─── KANBAN DRAG & DROP ───────────────────────────────
    // Optimistic: broadcast to all project members instantly
    socket.on('board:task_moved', ({ projectId, taskId, fromColumn, toColumn, newOrder }) => {
      socket.to(`project:${projectId}`).emit('board:task_moved', {
        taskId, fromColumn, toColumn, newOrder,
        movedBy: { _id: user._id, name: user.name },
      });
    });

    socket.on('board:column_reordered', ({ projectId, columns }) => {
      socket.to(`project:${projectId}`).emit('board:column_reordered', { columns });
    });

    // ─── CHAT ─────────────────────────────────────────────
    socket.on('channel:join', (channelId) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('channel:leave', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on('channel:typing', ({ channelId }) => {
      socket.to(`channel:${channelId}`).emit('channel:typing', {
        userId: user._id,
        name: user.name,
        avatar: user.avatar,
      });
    });

    socket.on('channel:stop_typing', ({ channelId }) => {
      socket.to(`channel:${channelId}`).emit('channel:stop_typing', { userId: user._id });
    });

    socket.on('message:send', async ({ channelId, content, attachments, replyTo, mentions }) => {
      try {
        const channel = await Channel.findById(channelId);
        if (!channel || !channel.members.includes(user._id)) return;

        const message = await Message.create({
          channel: channelId,
          sender: user._id,
          content,
          attachments: attachments || [],
          replyTo: replyTo || null,
          mentions: mentions || [],
        });

        await Channel.findByIdAndUpdate(channelId, { lastMessage: new Date() });

        const populated = await message.populate([
          { path: 'sender', select: 'name avatar' },
          { path: 'replyTo', populate: { path: 'sender', select: 'name' } },
        ]);

        io.to(`channel:${channelId}`).emit('message:new', populated);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:react', async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const reaction = message.reactions.find(r => r.emoji === emoji);
        if (reaction) {
          const idx = reaction.users.indexOf(user._id);
          if (idx > -1) reaction.users.splice(idx, 1);
          else reaction.users.push(user._id);
          if (reaction.users.length === 0) {
            message.reactions = message.reactions.filter(r => r.emoji !== emoji);
          }
        } else {
          message.reactions.push({ emoji, users: [user._id] });
        }

        await message.save();
        io.to(`channel:${message.channel}`).emit('message:reaction_updated', {
          messageId,
          reactions: message.reactions,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to react' });
      }
    });

    // ─── DISCONNECT ───────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔴 Socket disconnected: ${user.name}`);
      await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen: new Date() });
      io.emit('user:offline', { userId: user._id, lastSeen: new Date() });
    });
  });

  return io;
};

const getIO = () => io;

// Emit task update to project room (called from controllers)
const emitTaskUpdate = (projectId, event, data) => {
  if (io) io.to(`project:${projectId}`).emit(event, data);
};

// Emit to specific user room
const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

export { initSocket, getIO, emitTaskUpdate, emitToUser };