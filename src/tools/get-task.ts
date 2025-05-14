/**
 * Get Task Tool
 * 
 * Retrieves tasks from the CodeRide API with optional filtering
 */
import { z } from 'zod';
import { BaseTool } from '../utils/base-tool';
import { apiClient } from '../utils/api-client'; // Import the new API client
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
 * Schema for the get-task tool input
 */
const GetTaskSchema = z.object({
  // Workspace ID (required for new API)
  workspaceId: z.string().describe("Workspace ID from CodeRide"),

  // Project slug filter (optional)
  slug: z.string().optional(),
  
  // Task number filter (optional)
  number: z.string().optional(),
  
  // Optional status filter with predefined values
  status: z.enum(['to-do', 'in-progress', 'completed']).optional(),
  
  // Optional agent filter
  agent: z.string().optional(),
  
  // Optional limit for number of results (default: 10)
  // Using coerce to handle string inputs from MCP Inspector
  limit: z.coerce.number().int().positive().optional().default(10),
  
  // Optional offset for pagination (default: 0)
  // Using coerce to handle string inputs from MCP Inspector
  offset: z.coerce.number().int().nonnegative().optional().default(0),
}).strict()
  // Require either slug or number
  .refine(data => !!data.slug || !!data.number, {
    message: "Either project slug or task number is required",
    path: ["identifier"]
  });

/**
 * Type for the get-task tool input
 */
type GetTaskInput = z.infer<typeof GetTaskSchema>;

/**
 * Get Task Tool Implementation
 */
export class GetTaskTool extends BaseTool<typeof GetTaskSchema> {
  readonly name = 'get_task';
  readonly description = 'Retrieve tasks with optional filtering';
  readonly schema = GetTaskSchema;

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
        },
        status: {
          type: "string",
          enum: ["to-do", "in-progress", "completed"],
          description: "Task status filter"
        },
        agent: {
          type: "string",
          description: "Filter tasks by assigned AI agent"
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 100,
          description: "Maximum number of tasks to return (default: 10)"
        },
        offset: {
          type: "number",
          minimum: 0,
          description: "Number of tasks to skip for pagination (default: 0)"
        }
      },
      required: ["workspaceId"] // workspaceId is now required
    };
  }

  /**
   * Execute the get-task tool
   */
  async execute(input: GetTaskInput): Promise<unknown> {
    logger.info('Executing get-task tool', input);

    try {
      const requestBody: any = {
        workspaceId: input.workspaceId,
        limit: input.limit,
        offset: input.offset,
      };

      if (input.number) {
        requestBody.number = input.number.toUpperCase();
      } else if (input.slug) {
        requestBody.slug = input.slug;
      }

      if (input.status) {
        requestBody.status = input.status;
      }

      if (input.agent) {
        requestBody.agent = input.agent;
      }

      // Use the new API client to get tasks and cast the response data
      const responseData = await apiClient.post('/v1/tasks', requestBody) as GetTasksResponse;
      const tasks = responseData.tasks; // Access tasks from the casted response data

      // Return formatted response
      return {
        success: true,
        count: tasks.length,
        tasks: tasks.map((task: any) => { // Assuming task structure from API
          return {
            number: task.number,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            agent: task.agent,
            agent_prompt: task.agentPrompt, // Adjusting field name based on common API patterns
            context: task.context,
            instructions: task.instructions
          };
        })
      };
    } catch (error) {
      logger.error('Error in get-task tool', error as Error);
      
      return {
        success: false,
        error: (error as Error).message,
        tasks: []
      };
    }
  }
}
