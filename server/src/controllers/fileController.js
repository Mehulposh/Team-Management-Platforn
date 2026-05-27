import Task from '../models/taskModel.js';
import { cloudinary } from '../config/cloudinaryConfig.js';

// POST /api/files/upload/task/:taskId
export const uploadTaskAttachment = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const attachment = {
      filename: req.file.originalname,
      url: req.file.path,
      publicId: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
    };

    task.attachments.push(attachment);
    task.activity.push({
      user: req.user._id,
      action: 'uploaded',
      message: `attached "${req.file.originalname}"`,
    });
    await task.save();

    res.status(201).json({ attachment });
  } catch (err) { next(err); }
};

// DELETE /api/files/task/:taskId/:attachmentId
export const deleteTaskAttachment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    // Delete from Cloudinary
    if (attachment.publicId) {
      await cloudinary.uploader.destroy(attachment.publicId);
    }

    task.attachments = task.attachments.filter(
      a => a._id.toString() !== req.params.attachmentId
    );
    await task.save();

    res.json({ message: 'Attachment deleted' });
  } catch (err) { next(err); }
};

// POST /api/files/upload/avatar
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: req.file.path });
  } catch (err) { next(err); }
};