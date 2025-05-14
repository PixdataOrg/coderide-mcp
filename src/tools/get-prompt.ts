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
 * Define the expected structure of the API response for getting tasks
 */
interface GetTasksResponse {
  tasks: any[]; // Assuming tasks is an array of any type for now
  count: number;
  // Add other expected fields from the API response if known
}

/**
 * Schema for the get-prompt tool input
 */
const GetPromptSchema = z.object({
  // Workspace ID (required for new API)
  workspaceId: z.string().describe("Workspace ID from CodeRide"),

  // Project slug (URL-friendly identifier)
  slug: z.string({
    required_error: "Project slug is required"
  }),
  
  // Task number (e.g., "CFW-1")
  number: z.string({
    required_error: "Task number is required"
  }),
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
        workspaceId: {
          type: "string",
          description: "Workspace ID from CodeRide"
        },
        slug: {
          type: "string",
          description: "Project slug identifier (e.g., 'CFW')"
        },
        number: {
          type: "string",
          description: "Task number identifier (e.g., 'CFW-1')"
        }
      },
      required: ["workspaceId", "slug", "number"]
    };
  }

  /**
   * Execute the get-prompt tool
   */
  async execute(input: GetPromptInput): Promise<unknown> {
    logger.info('Executing get-prompt tool', input);

    try {
      // Get the task by number and workspace ID
      const requestBody: any = {
        workspaceId: input.workspaceId,
        slug: input.slug,
        number: input.number.toUpperCase() // Convert to uppercase for consistency
      };
      
      // Use the new API client to get tasks and cast the response data
      const responseData = await apiClient.post('/v1/tasks', requestBody) as GetTasksResponse;
      const tasks = responseData.tasks; // Access tasks from the casted response data
      
      if (!tasks || tasks.length === 0) {
        return {
          success: false,
          error: `Task with number '${input.number}' not found in project '${input.slug}'`,
          prompt: null
        };
      }
      
      // Return the task_prompt field
      return {
        success: true,
        task: {
          number: tasks[0].number,
          title: tasks[0].title,
          prompt: tasks[0].task_prompt || tasks[0].agentPrompt // Try both field names
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
