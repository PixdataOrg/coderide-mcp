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
  // Workspace ID (required for new API)
  workspaceId: z.string().describe("Workspace ID from CodeRide"),

  // Required field to identify the task
  number: z.string({
    required_error: "Task number is required to identify the task",
    invalid_type_error: "Task number must be a string"
  }),
  
  // Optional fields that can be updated
  description: z.string().optional(),
  status: z.enum(['to-do', 'in-progress', 'completed'], {
    invalid_type_error: "Status must be one of: to-do, in-progress, completed"
  }).optional(),
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
  workspaceId: "workspace-123", // Added workspaceId
  number: "123",
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
        workspaceId: {
          type: "string",
          description: "Workspace ID from CodeRide"
        },
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
      required: ["workspaceId", "number"] // workspaceId is now required
    };
  }

  /**
   * Execute the update-task tool
   */
  async execute(input: UpdateTaskInput): Promise<unknown> {
    logger.info('Executing update-task tool', input);

    try {
      // Extract task number and workspace ID
      const { number, workspaceId, ...updateData } = input;
      
      // Convert task number to uppercase for consistency
      const taskNumber = number.toUpperCase();
      
      // The new API updates by ID, so we need to get the task first to find the ID
      // Using the get-task endpoint to find the task by number and workspaceId
      const getTaskResponse = await apiClient.post('/v1/tasks', {
        workspaceId: workspaceId,
        number: taskNumber
      }) as { tasks: { id: string }[] }; // Assuming the get tasks endpoint returns an array with id

      if (!getTaskResponse || !getTaskResponse.tasks || getTaskResponse.tasks.length === 0) {
        return {
          success: false,
          error: `Task with number ${number} not found in workspace ${workspaceId}`,
          notFound: true
        };
      }
      
      const taskId = getTaskResponse.tasks[0].id;
      
      // Update task using the new API endpoint
      const responseData = await apiClient.put(`/v1/tasks/${taskId}/update`, {
        workspaceId: workspaceId, // Include workspaceId in the update body as well, based on Postman
        ...updateData
      }) as UpdateTaskResponse; // Cast the response data

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
