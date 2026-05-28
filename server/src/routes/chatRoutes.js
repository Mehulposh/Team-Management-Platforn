import express from 'express';
const router = express.Router();
import { getChannels, createChannel, getMessages, joinChannel, deleteMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

router.use(protect);
router.get('/channels', getChannels);
router.post('/channels', createChannel);
router.post('/channels/:channelId/join', joinChannel);
router.get('/channels/:channelId/messages', getMessages);
router.delete('/messages/:messageId', deleteMessage);

export default router;