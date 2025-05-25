/**
 * Get Prompt Tool
 * 
 * Retrieves task prompt from the CodeRide API for a specific task
 */
import { z } from 'zod';
import { BaseTool } from '../utils/base-tool';
import { apiClient } from '../utils/api-client';
import { logger } from '../utils/logger';

/**
 * Define the expected structure of the API response for getting task prompt
 */
interface TaskData {
  number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  agent?: string;
  agentPrompt?: string;
  task_prompt?: string;
  context?: string;
  instructions?: string;
  // Include other relevant fields if the API returns them
}

interface GetTaskResponse {
  // Single task response fields
  number?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  agent?: string;
  agentPrompt?: string;
  task_prompt?: string;
  context?: string;
  instructions?: string;
  // Add other expected fields from the API response if known
}

/**
 * Schema for the get-prompt tool input
 */
const GetPromptSchema = z.object({
  // Project slug (URL-friendly identifier)
  slug: z.string({
    required_error: "Project slug is required"
  }).describe("Project slug identifier (e.g., 'CFW')"),
  
  // Task number (e.g., "CFW-1")
  number: z.string({
    required_error: "Task number is required"
  }).describe("Task number identifier (e.g., 'CFW-1')"),
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
  readonly description = 'Retrieve task prompt by task number and project slug';
  readonly schema = GetPromptSchema;

  /**
   * Get input schema for documentation
   */
  getInputSchema(): Record<string, any> {
    return {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Project slug identifier (e.g., 'CFW')"
        },
        number: {
          type: "string",
          description: "Task number identifier (e.g., 'CFW-1')"
        }
      },
      required: ["slug", "number"]
    };
  }

  /**
   * Execute the get-prompt tool
   */
  async execute(input: GetPromptInput): Promise<unknown> {
    logger.info('Executing get-prompt tool', input);

    try {
      // Get the task prompt by number
      const taskNumber = input.number.toUpperCase(); // Convert to uppercase for consistency
      const url = `/task/number/${taskNumber}/prompt`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await apiClient.get(url) as GetTaskResponse;
      
      if (!responseData || (!responseData.number && !responseData.title)) {
        return {
          success: false,
          error: `Task with number '${input.number}' not found in project '${input.slug}'`,
          prompt: null
        };
      }
      
      // Return the task_prompt or agentPrompt field
      return {
        success: true,
        task: {
          number: responseData.number,
          title: responseData.title,
          prompt: responseData.task_prompt || responseData.agentPrompt // Try both field names
        }
      };
    } catch (error) {
      logger.error('Error in get-prompt tool', error as Error);
      
      return {
        success: false,
        error: (error as Error).message,
        prompt: null
      };
    }
  }
}
