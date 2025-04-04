const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Chat endpoint for handling user messages
router.post('/', chatController.handleMessage);

// Get conversation history
router.get('/history/:sessionId', chatController.getHistory);

// Clear conversation history
router.delete('/history/:sessionId', chatController.clearHistory);

module.exports = router;
