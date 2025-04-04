const axios = require('axios');

// Get MCP servers from environment variables
const mcpServers = process.env.MCP_SERVERS ? process.env.MCP_SERVERS.split(',') : [];
const mcpConfig = {};

// Initialize MCP configuration
mcpServers.forEach(server => {
  const urlEnvVar = `MCP_SERVER_${server.toUpperCase()}_URL`;
  if (process.env[urlEnvVar]) {
    mcpConfig[server] = {
      url: process.env[urlEnvVar]
    };
  }
});

/**
 * Enhance workflow structure with MCP capabilities
 * @param {Object} workflowStructure - The structured workflow definition
 * @returns {Object} - Enhanced workflow structure with MCP integrations
 */
async function enhanceWithMCPs(workflowStructure) {
  try {
    // Skip if no MCPs needed or configured
    if (!workflowStructure.mcps || workflowStructure.mcps.length === 0 || Object.keys(mcpConfig).length === 0) {
      return workflowStructure;
    }
    
    // For each identified MCP candidate
    for (const mcpCandidate of workflowStructure.mcps) {
      const { nodeId, mcpType, recommendedMCP } = mcpCandidate;
      
      // Check if the recommended MCP is configured
      if (mcpConfig[recommendedMCP]) {
        // Find the node to enhance
        const nodeIndex = workflowStructure.nodes.findIndex(node => node.id === nodeId);
        
        if (nodeIndex !== -1) {
          // Enhance the node with MCP capabilities
          workflowStructure.nodes[nodeIndex] = await enhanceNodeWithMCP(
            workflowStructure.nodes[nodeIndex],
            mcpType,
            recommendedMCP
          );
        }
      }
    }
    
    return workflowStructure;
  } catch (error) {
    console.error('Error enhancing workflow with MCPs:', error);
    // Return original structure if enhancement fails
    return workflowStructure;
  }
}

/**
 * Enhance a specific node with MCP capabilities
 * @param {Object} node - The node to enhance
 * @param {string} mcpType - The type of MCP to apply
 * @param {string} mcpId - The specific MCP identifier
 * @returns {Object} - Enhanced node
 */
async function enhanceNodeWithMCP(node, mcpType, mcpId) {
  // Clone the node to avoid reference issues
  const enhancedNode = { ...node };
  
  // Add MCP metadata to the node
  enhancedNode.mcp = {
    id: mcpId,
    type: mcpType,
    url: mcpConfig[mcpId]?.url
  };
  
  // Fetch MCP schema to understand its capabilities
  if (mcpConfig[mcpId]?.url) {
    try {
      const response = await axios.get(`${mcpConfig[mcpId].url}/schema`);
      enhancedNode.mcp.schema = response.data;
      
      // Update node parameters based on MCP schema
      // This is where you'd map the MCP capabilities to node parameters
      enhancedNode.parameters = enhancedNode.parameters || {};
      enhancedNode.parameters.mcpEnabled = true;
      enhancedNode.parameters.mcpEndpoint = mcpConfig[mcpId].url;
      
      // Add other MCP-specific parameters based on type
      if (mcpType === 'search') {
        enhancedNode.parameters.mcpSearchOptions = {
          count: 10,
          useSmartExtraction: true
        };
      } else if (mcpType === 'code') {
        enhancedNode.parameters.mcpCodeOptions = {
          language: 'javascript',
          includeTests: true
        };
      } else if (mcpType === 'llm') {
        enhancedNode.parameters.mcpLLMOptions = {
          temperature: 0.7,
          maxTokens: 2000
        };
      }
    } catch (error) {
      console.error(`Error fetching schema for MCP ${mcpId}:`, error);
    }
  }
  
  return enhancedNode;
}

module.exports = {
  enhanceWithMCPs
};
