/**
 * Update Task Tool
 * 
 * Updates an existing task using the CodeRide API
 */
import { z } from 'zod';
import { BaseTool } from '../utils/base-tool';
import { apiClient } from '../utils/api-client'; // Import the new API client
import { logger } from '../utils/logger';

/**
 * Define the expected structure of the API response for updating tasks
 */
interface UpdateTaskResponse {
  success: boolean;
  message?: string;
  task?: { // Assuming the API returns the updated task
    number: string;
    title: string;
    description: string;
    status: string;
    // Include other relevant fields if the API returns them
  };
  notFound?: boolean;
}

/**
 * Schema for the update-task tool input
 */
const UpdateTaskSchema = z.object({
  // Required field to identify the task
  number: z.string({
    required_error: "Task number is required to identify the task",
    invalid_type_error: "Task number must be a string"
  }).describe("Task number to identify the task to update"),
  
  // Optional fields that can be updated
  description: z.string().optional().describe("New task description"),
  status: z.enum(['to-do', 'in-progress', 'completed'], {
    invalid_type_error: "Status must be one of: to-do, in-progress, completed"
  }).optional().describe("New task status"),
}).strict().refine(
  // Ensure at least one field to update is provided
  (data) => {
    const updateFields = ['description', 'status'];
    return updateFields.some(field => field in data);
  },
  {
    message: 'At least one field to update must be provided',
    path: ['updateFields']
  }
);

/**
 * Example input schema for documentation
 */
const exampleInput = {
  number: "CFW-123",
  status: "in-progress",
  description: "Updated task description"
};

/**
 * Type for the update-task tool input
 */
type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

/**
 * Update Task Tool Implementation
 */
export class UpdateTaskTool extends BaseTool<typeof UpdateTaskSchema> {
  readonly name = 'update_task';
  readonly description = 'Update an existing task';
  readonly schema = UpdateTaskSchema;
  
  /**
   * Get input schema for documentation
   */
  getInputSchema(): Record<string, any> {
    return {
      type: "object",
      properties: {
        number: {
          type: "string",
          description: "Task number to identify the task to update"
        },
        description: {
          type: "string",
          description: "New task description"
        },
        status: {
          type: "string",
          enum: ["to-do", "in-progress", "completed"],
          description: "New task status"
        }
      },
      required: ["number"]
    };
  }

  /**
   * Execute the update-task tool
   */
  async execute(input: UpdateTaskInput): Promise<unknown> {
    logger.info('Executing update-task tool', input);

    try {
      // Extract task number
      const { number, ...updateData } = input;
      
      // Convert task number to uppercase for consistency
      const taskNumber = number.toUpperCase();
      
      // Update task using the API endpoint
      const url = `/task/number/${taskNumber}`;
      logger.debug(`Making PUT request to: ${url}`);
      
      const responseData = await apiClient.put(url, updateData) as UpdateTaskResponse;

      // Return formatted response
      return {
        success: responseData.success,
        message: responseData.message || 'Task updated successfully',
        task: responseData.task
      };
    } catch (error) {
      logger.error('Error in update-task tool', error as Error);
      
      // Check if it's a not found error based on API response structure or message
      const isNotFoundError = (error as any).notFound || (error as Error).message.includes('not found');
      
      return {
        success: false,
        error: (error as Error).message,
        notFound: isNotFoundError
      };
    }
  }
}
