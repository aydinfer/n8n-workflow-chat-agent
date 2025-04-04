require('dotenv').config();
const express = require('express');
const chatRouter = require('./routes/chat');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/chat', chatRouter);

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`n8n Workflow Chat Agent running on port ${port}`);
});
