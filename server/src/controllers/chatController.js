import { Channel, Message } from '../models/chatModel.js';

// GET /api/chat/channels?workspace=id
export const getChannels = async (req, res, next) => {
  try {
    const { workspace } = req.query;
   
    // Debug: Count channels before query
    const totalChannels = await Channel.countDocuments({ workspace });
    const publicChannels = await Channel.countDocuments({ workspace, type: 'public' });

    const channels = await Channel.find({
      workspace,
      $or: [{ type: 'public' }, { type: 'private', members: req.user._id }],
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

    if (!workspace) return res.status(400).json({ error: 'workspace is required' });
    if (!name?.trim()) return res.status(400).json({ error: 'Channel name is required' })

    // Check for duplicate name in this workspace
    const exists = await Channel.findOne({ workspace, name: name.trim(), isArchived: false });
    if (exists) return res.status(409).json({ error: `A channel named #${name} already exists` });

    const channel = await Channel.create({
      workspace,
      project: project || null,
      name: name.trim(),
      description: description || '',
      type: type || 'public',
      members: memberSet,
      createdBy: req.user._id,
    });
 
    await channel.populate([
      { path: 'members', select: 'name avatar isOnline' },
      { path: 'createdBy', select: 'name avatar' },
    ]);
    res.status(201).json({ channel });
  } catch (err) { next(err); }
};

// GET /api/chat/channels/:channelId/messages
export const getMessages = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
 
    // Allow reading public channels even without membership
    const isMember = channel.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (channel.type === 'private' && !isMember) {
      return res.status(403).json({ error: 'Not a member of this channel' });
    }
 
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
// Auto-join a public channel — called by frontend when user selects a channel they aren't in
export const joinChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    if (channel.type === 'private') {
      return res.status(403).json({ error: 'This is a private channel. You need an invitation.' });
    }
 
    const updated = await Channel.findByIdAndUpdate(
      req.params.channelId,
      { $addToSet: { members: req.user._id } },
      { new: true }
    ).populate('members', 'name avatar isOnline');
 
    res.json({ channel: updated });
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