const nlProcessor = require('../services/nlProcessor');
const mermaidParser = require('../services/mermaidParser');
const workflowGenerator = require('../services/workflowGenerator');
const mcpIntegration = require('../services/mcpIntegration');

// In-memory storage for conversation history
// In production, you'd use a proper database
const conversations = {};

/**
 * Handle incoming chat messages
 */
async function handleMessage(req, res) {
  try {
    const { message, sessionId, inputType = 'natural_language' } = req.body;
    
    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId are required' });
    }
    
    // Initialize conversation if it doesn't exist
    if (!conversations[sessionId]) {
      conversations[sessionId] = [];
    }
    
    // Add user message to history
    conversations[sessionId].push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Process the message based on input type
    let workflowStructure;
    if (inputType === 'mermaid') {
      workflowStructure = await mermaidParser.parseDiagram(message);
    } else {
      workflowStructure = await nlProcessor.processInstruction(message);
    }
    
    // Check if MCPs are needed and integrate them
    workflowStructure = await mcpIntegration.enhanceWithMCPs(workflowStructure);
    
    // Generate the n8n workflow
    const workflow = await workflowGenerator.createWorkflow(workflowStructure);
    
    // Prepare the response
    const response = {
      workflow,
      message: `I've created a workflow based on your ${inputType === 'mermaid' ? 'diagram' : 'instructions'}.`,
      sessionId
    };
    
    // Add agent message to history
    conversations[sessionId].push({
      role: 'agent',
      content: response.message,
      workflow: workflow,
      timestamp: new Date()
    });
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error handling message:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get conversation history
 */
function getHistory(req, res) {
  const { sessionId } = req.params;
  
  if (!conversations[sessionId]) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  return res.status(200).json({
    sessionId,
    history: conversations[sessionId]
  });
}

/**
 * Clear conversation history
 */
function clearHistory(req, res) {
  const { sessionId } = req.params;
  
  if (!conversations[sessionId]) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  conversations[sessionId] = [];
  
  return res.status(200).json({
    sessionId,
    message: 'Conversation history cleared'
  });
}

module.exports = {
  handleMessage,
  getHistory,
  clearHistory
};
