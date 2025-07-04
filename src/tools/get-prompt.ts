/**
 * Get Prompt Tool
 * 
 * Retrieves task prompt from the CodeRide API for a specific task
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations } from '../utils/base-tool';
import { apiClient, TaskApiResponse } from '../utils/api-client'; // Import TaskApiResponse
import { logger } from '../utils/logger';

/**
 * Schema for the get-prompt tool input
 */
const GetPromptSchema = z.object({
  // Task number (e.g., "CRD-1")
  number: z.string({
    required_error: "Task number is required"
  }).regex(/^[A-Z]{3}-\d+$/, { message: "Task number must be in the format ABC-123 (e.g., CRD-1)." }),
}).strict();

/**
 * Type for the get-prompt tool input
 */
type GetPromptInput = z.infer<typeof GetPromptSchema>;

/**
 * Get Prompt Tool Implementation
 */
export class GetPromptTool extends BaseTool<typeof GetPromptSchema> {
  readonly name = 'get_prompt';
  readonly description = "Retrieves the specific instructions or prompt for a given task, identified by its unique task number (e.g., 'CRD-1'). This is typically used to understand the detailed requirements or context for an AI agent to work on the task.";
  readonly zodSchema = GetPromptSchema; // Renamed from schema
  readonly annotations: ToolAnnotations = {
    title: "Get Task Prompt",
    readOnlyHint: true,
    openWorldHint: true, // Interacts with an external API
  };

  /**
   * Returns the full tool definition conforming to MCP.
   */
  getMCPToolDefinition(): MCPToolDefinition {
    return {
      name: this.name,
      description: this.description,
      annotations: this.annotations,
      inputSchema: {
        type: "object",
        properties: {
          number: {
            type: "string",
            pattern: "^[A-Z]{3}-\\d+$",
            description: "The unique identifier for the task (e.g., 'CRD-1'). Must follow the format: three uppercase letters, a hyphen, and one or more digits."
          }
        },
        required: ["number"],
        additionalProperties: false
      }
    };
  }

  /**
   * Execute the get-prompt tool
   */
  async execute(input: GetPromptInput): Promise<unknown> {
    logger.info('Executing get-prompt tool', input);

    try {
      // Get the task prompt using the specific endpoint /task/number/:taskNumber/prompt
      const taskNumber = input.number.toUpperCase(); // Convert to uppercase for consistency
      const url = `/task/number/${taskNumber}/prompt`; 
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await apiClient.get<TaskApiResponse>(url) as unknown as TaskApiResponse;
      
      if (!responseData) { 
        logger.warn(`No response data received for task number ${taskNumber} from ${url}. This might indicate the task has no prompt or an API issue.`);
        return { taskPrompt: '' }; // Output camelCase, return empty if no data
      }
      
      // User confirmed API returns 'taskPrompt' (camelCase) for this endpoint.
      // TaskApiResponse interface has been updated accordingly.
      return {
        taskPrompt: responseData.taskPrompt || '' // Access camelCase, output camelCase
      };

    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      logger.error(`Error in get-prompt tool: ${errorMessage}`, error instanceof Error ? error : undefined);
      
      return {
        isError: true,
        content: [{ type: "text", text: errorMessage }]
      };
    }
  }
}
