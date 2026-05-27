import { Channel, Message } from '../models/chatModel.js';

// GET /api/chat/channels?workspace=id
export const getChannels = async (req, res, next) => {
  try {
    const { workspace } = req.query;
    const channels = await Channel.find({
      workspace,
      $or: [{ type: 'public' }, { members: req.user._id }],
      isArchived: false,
    })
      .populate('members', 'name avatar isOnline')
      .populate('createdBy', 'name avatar')
      .sort({ lastMessage: -1 });
    res.json({ channels });
  } catch (err) { next(err); }
};

// POST /api/chat/channels
export const createChannel = async (req, res, next) => {
  try {
    const { workspace, project, name, description, type, members } = req.body;
    const channel = await Channel.create({
      workspace, project, name, description,
      type: type || 'public',
      members: [...new Set([...(members || []), req.user._id.toString()])],
      createdBy: req.user._id,
    });
    await channel.populate([
      { path: 'members', select: 'name avatar' },
      { path: 'createdBy', select: 'name avatar' },
    ]);
    res.status(201).json({ channel });
  } catch (err) { next(err); }
};

// GET /api/chat/channels/:channelId/messages
export const getMessages = async (req, res, next) => {
  try {
    const { before, limit = 50 } = req.query;
    const query = { channel: req.params.channelId, isDeleted: false };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .populate('sender', 'name avatar')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ messages: messages.reverse() });
  } catch (err) { next(err); }
};

// POST /api/chat/channels/:channelId/join
export const joinChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findByIdAndUpdate(
      req.params.channelId,
      { $addToSet: { members: req.user._id } },
      { new: true }
    ).populate('members', 'name avatar');
    res.json({ channel });
  } catch (err) { next(err); }
};

// DELETE /api/chat/messages/:messageId
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    message.isDeleted = true;
    message.content = '[deleted]';
    await message.save();
    res.json({ message: 'Message deleted' });
  } catch (err) { next(err); }
};