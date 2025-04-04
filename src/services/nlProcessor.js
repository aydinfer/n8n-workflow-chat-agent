const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Process natural language instructions and convert them to workflow structure
 * @param {string} instruction - The user's natural language instruction
 * @returns {Object} - Structured workflow definition
 */
async function processInstruction(instruction) {
  try {
    // Use OpenAI to parse the natural language instruction
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert in translating natural language instructions into structured workflow definitions for n8n.
          
Your task is to convert the user's instructions into a JSON structure that describes an n8n workflow.

Output ONLY valid JSON with no additional text. The JSON should include:
- nodes: An array of workflow nodes with types, positions, and connections
- edges: Connections between nodes
- triggers: Entry points for the workflow
- mcps: Any MCP (Model Calling Protocol) services that might be needed

Ensure your output is properly structured and includes all necessary information to build a complete workflow.`
        },
        {
          role: "user",
          content: instruction
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    // Parse the JSON response
    const workflowStructure = JSON.parse(response.choices[0].message.content);
    return workflowStructure;
  } catch (error) {
    console.error('Error processing natural language instruction:', error);
    throw new Error('Failed to process your instruction. Please try again with more specific details.');
  }
}

module.exports = {
  processInstruction
};
