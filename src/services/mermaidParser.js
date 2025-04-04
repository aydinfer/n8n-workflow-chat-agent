/**
 * Parse mermaid diagram into a structured workflow definition
 * @param {string} diagram - The mermaid diagram string
 * @returns {Object} - Structured workflow definition
 */
async function parseDiagram(diagram) {
  try {
    // For now, we'll use a simplified approach to parse the mermaid syntax
    // In a production environment, you'd want to use a proper parser library
    
    // Extract nodes
    const nodeRegex = /([A-Za-z0-9_]+)\[([^\]]+)\]/g;
    const nodes = [];
    let match;
    
    while ((match = nodeRegex.exec(diagram)) !== null) {
      nodes.push({
        id: match[1],
        name: match[2],
        type: determineNodeType(match[2])
      });
    }
    
    // Extract connections/edges
    const edgeRegex = /([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)/g;
    const edges = [];
    
    while ((match = edgeRegex.exec(diagram)) !== null) {
      edges.push({
        source: match[1],
        target: match[2]
      });
    }
    
    // Determine trigger nodes (nodes without incoming edges)
    const targetNodes = edges.map(edge => edge.target);
    const triggers = nodes
      .filter(node => !targetNodes.includes(node.id))
      .map(node => node.id);
    
    // Identify potential MCPs
    const mcps = identifyPotentialMCPs(nodes);
    
    return {
      nodes,
      edges,
      triggers,
      mcps
    };
  } catch (error) {
    console.error('Error parsing mermaid diagram:', error);
    throw new Error('Failed to parse the mermaid diagram. Please check your syntax and try again.');
  }
}

/**
 * Determine the type of node based on its name/description
 * @param {string} nodeName - The name or description of the node
 * @returns {string} - The determined node type
 */
function determineNodeType(nodeName) {
  const lowerName = nodeName.toLowerCase();
  
  // Map common node names to n8n node types
  if (lowerName.includes('http') && (lowerName.includes('trigger') || lowerName.includes('webhook'))) {
    return 'n8n-nodes-base.webhooktrigger';
  } else if (lowerName.includes('slack')) {
    return 'n8n-nodes-base.slack';
  } else if (lowerName.includes('email')) {
    return 'n8n-nodes-base.emailsend';
  } else if (lowerName.includes('ai') || lowerName.includes('claude') || lowerName.includes('gpt')) {
    return 'n8n-nodes-base.openai';
  } else if (lowerName.includes('search') || lowerName.includes('brave')) {
    return 'custom.bravesearch';
  } else if (lowerName.includes('github')) {
    return 'n8n-nodes-base.github';
  } else if (lowerName.includes('decision') || lowerName.includes('if') || lowerName.includes('condition')) {
    return 'n8n-nodes-base.if';
  } else if (lowerName.includes('function') || lowerName.includes('code')) {
    return 'n8n-nodes-base.function';
  }
  
  // Default to function node if no match is found
  return 'n8n-nodes-base.function';
}

/**
 * Identify potential MCPs based on node types
 * @param {Array} nodes - The array of workflow nodes
 * @returns {Array} - Identified potential MCPs
 */
function identifyPotentialMCPs(nodes) {
  const mcpCandidates = [];
  
  for (const node of nodes) {
    const lowerName = node.name.toLowerCase();
    
    // Identify AI-related nodes that might benefit from MCPs
    if (lowerName.includes('search') || lowerName.includes('brave')) {
      mcpCandidates.push({
        nodeId: node.id,
        mcpType: 'search',
        recommendedMCP: 'brave-search-mcp'
      });
    } else if (lowerName.includes('code') || lowerName.includes('github')) {
      mcpCandidates.push({
        nodeId: node.id,
        mcpType: 'code',
        recommendedMCP: 'github-mcp'
      });
    } else if (lowerName.includes('ai') || lowerName.includes('claude') || lowerName.includes('gpt')) {
      mcpCandidates.push({
        nodeId: node.id,
        mcpType: 'llm',
        recommendedMCP: 'openai-mcp'
      });
    }
  }
  
  return mcpCandidates;
}

module.exports = {
  parseDiagram
};
