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
interface TaskData {
  number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  agent?: string;
  agentPrompt?: string;
  context?: string;
  instructions?: string;
  // Include other relevant fields if the API returns them
}

interface GetTasksResponse {
  tasks?: TaskData[];
  count?: number;
  // Single task response fields
  number?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  agent?: string;
  agentPrompt?: string;
  context?: string;
  instructions?: string;
  // Add other expected fields from the API response if known
}

/**
 * Schema for the get-task tool input
 */
const GetTaskSchema = z.object({
  // Task number (required)
  number: z.string().describe("Task number identifier (e.g., 'CFW-1')"),
  
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
}).strict();

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
      required: ["number"]
    };
  }

  /**
   * Execute the get-task tool
   */
  async execute(input: GetTaskInput): Promise<unknown> {
    logger.info('Executing get-task tool', input);

    try {
      // Use the API client to get task by number
      const url = `/task/number/${input.number.toUpperCase()}`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await apiClient.get(url) as GetTasksResponse;
      
      // Handle both array and single object responses
      let tasks: TaskData[] = [];
      
      if (responseData.tasks) {
        // Response contains a tasks array
        tasks = responseData.tasks;
      } else if (responseData.number) {
        // Response is a single task object
        tasks = [{
          number: responseData.number,
          title: responseData.title || '',
          description: responseData.description || '',
          status: responseData.status || '',
          priority: responseData.priority || '',
          agent: responseData.agent,
          agentPrompt: responseData.agentPrompt,
          context: responseData.context,
          instructions: responseData.instructions
        }];
      }

      // Return formatted response
      return {
        success: true,
        count: tasks.length,
        tasks: tasks
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
