const express = require('express');
const router = express.Router();
const { uploadTaskAttachment, deleteTaskAttachment, uploadAvatar } = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.use(protect);
router.post('/upload/task/:taskId', upload.single('file'), uploadTaskAttachment);
router.delete('/task/:taskId/:attachmentId', deleteTaskAttachment);
router.post('/upload/avatar', upload.single('avatar'), uploadAvatar);

export default router;