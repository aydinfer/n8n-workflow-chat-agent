const axios = require('axios');

// n8n API configuration
const n8nBaseUrl = process.env.N8N_URL || 'http://localhost:5678';
const n8nApiKey = process.env.N8N_API_KEY;

// Axios instance for n8n API
const n8nApi = axios.create({
  baseURL: n8nBaseUrl,
  headers: {
    'X-N8N-API-KEY': n8nApiKey,
    'Content-Type': 'application/json'
  }
});

/**
 * Create an n8n workflow from structured workflow definition
 * @param {Object} workflowStructure - The structured workflow definition
 * @returns {Object} - The created n8n workflow
 */
async function createWorkflow(workflowStructure) {
  try {
    // Convert our structure to n8n workflow format
    const n8nWorkflow = convertToN8nFormat(workflowStructure);
    
    // Create the workflow via n8n API
    const response = await n8nApi.post('/workflows', n8nWorkflow);
    
    return response.data;
  } catch (error) {
    console.error('Error creating n8n workflow:', error);
    throw new Error('Failed to create workflow in n8n. Please check your n8n configuration.');
  }
}

/**
 * Convert our structured workflow definition to n8n format
 * @param {Object} structure - Our structured workflow definition
 * @returns {Object} - n8n compatible workflow object
 */
function convertToN8nFormat(structure) {
  // Create empty workflow object
  const workflow = {
    name: 'Auto-Generated Workflow',
    nodes: [],
    connections: {},
    active: false,
    settings: {
      saveManualExecutions: true,
      callerPolicy: 'workflowsFromSameOwner'
    }
  };
  
  // Map our structure nodes to n8n nodes
  workflow.nodes = structure.nodes.map((node, index) => {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      parameters: {},
      typeVersion: 1,
      position: calculateNodePosition(index)
    };
  });
  
  // Map our structure edges to n8n connections
  structure.edges.forEach(edge => {
    if (!workflow.connections[edge.source]) {
      workflow.connections[edge.source] = [];
    }
    
    workflow.connections[edge.source].push({
      node: edge.target,
      type: 'main',
      index: 0
    });
  });
  
  return workflow;
}

/**
 * Calculate node position for visual layout
 * @param {number} index - Node index
 * @returns {Object} - x, y coordinates
 */
function calculateNodePosition(index) {
  // Simple layout algorithm - nodes in a line with some spacing
  const x = 250;
  const y = 100 + (index * 150);
  
  return { x, y };
}

module.exports = {
  createWorkflow
};
