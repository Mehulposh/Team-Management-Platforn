import express from 'express';
const router = express.Router();
import { uploadTaskAttachment, deleteTaskAttachment, uploadAvatar } from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinaryConfig.js';

router.use(protect);
router.post('/upload/task/:taskId', upload.single('file'), uploadTaskAttachment);
router.delete('/task/:taskId/:attachmentId', deleteTaskAttachment);
router.post('/upload/avatar', upload.single('avatar'), uploadAvatar);

export default router;