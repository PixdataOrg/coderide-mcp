/**
 * Update Task Tool
 * 
 * Updates an existing task using the CodeRide API
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations } from '../utils/base-tool';
import { apiClient, UpdateTaskApiResponse } from '../utils/api-client'; // Import UpdateTaskApiResponse
import { logger } from '../utils/logger';

// Removed local UpdateTaskResponse as UpdateTaskApiResponse from api-client.ts will be used.

/**
 * Schema for the update-task tool input
 */
const UpdateTaskSchema = z.object({
  // Required field to identify the task
  number: z.string({
    required_error: "Task number is required to identify the task",
    invalid_type_error: "Task number must be a string"
  })
  .regex(/^[A-Za-z]{3}-\d+$/, { message: "Task number must be in the format ABC-123 (e.g., CRD-1 or crd-1). Case insensitive." })
  .describe("Task number to identify the task to update (case insensitive)"),
  
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
  number: "CRD-1",
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
  readonly description = "Updates an existing task's 'description' and/or 'status'. The task is identified by its unique 'number' (e.g., 'CRD-1'). At least one of 'description' or 'status' must be provided for an update.";
  readonly zodSchema = UpdateTaskSchema; // Renamed from schema
  readonly annotations: ToolAnnotations = {
    title: "Update Task",
    readOnlyHint: false, // This tool modifies data
    destructiveHint: false, // Updates are generally not destructive
    idempotentHint: false, // Multiple identical updates might have different outcomes if not designed for idempotency
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
            pattern: "^[A-Za-z]{3}-\\d+$",
            description: "The unique identifier for the task to be updated (e.g., 'CRD-1' or 'crd-1'). Case insensitive - will be converted to uppercase."
          },
          description: {
            type: "string",
            description: "Optional. The new description for the task. If provided, it will replace the existing task description."
          },
          status: {
            type: "string",
            enum: ["to-do", "in-progress", "completed"],
            description: "Optional. The new status for the task. Must be one of: 'to-do', 'in-progress', 'completed'. If provided, it will update the task's current status."
          }
        },
        required: ["number"], // Zod .refine() handles the "at least one update field" logic at runtime.
        additionalProperties: false
      }
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
      
      const responseData = await apiClient.put<UpdateTaskApiResponse>(url, updateData) as unknown as UpdateTaskApiResponse;
      
      if (!responseData.success) {
        const apiErrorMessage = responseData.message || 'API reported update failure without a specific message.';
        logger.warn(`Update task API call for ${taskNumber} returned success:false. Message: ${apiErrorMessage}`);
        return {
          isError: true,
          content: [{ type: "text", text: `Update for task ${taskNumber} failed: ${apiErrorMessage}` }]
        };
      }

      // At this point, responseData.success is true
      const updatedFieldsList = Object.keys(updateData).join(', ') || 'no specific fields (refresh)'; // Handle case where updateData is empty if API allows
      const apiMessage = responseData.message || 'Task successfully updated.';

      if (responseData.task) {
        return {
          number: responseData.task.number,
          title: responseData.task.title,
          description: responseData.task.description,
          status: responseData.task.status,
          updateConfirmation: `Task ${responseData.task.number} updated fields: ${updatedFieldsList}. API: ${apiMessage}`
        };
      } else {
        // responseData.success is true, but responseData.task is missing.
        logger.warn(`Update task API call for ${taskNumber} succeeded but returned no task data. API message: ${apiMessage}`);
        return {
          number: taskNumber, // Use input taskNumber as fallback
          title: '', // No title info available from response
          description: input.description || '', // Fallback to input description if available
          status: input.status || '',       // Fallback to input status if available
          updateConfirmation: `Task ${taskNumber} update reported success by API, but full task details were not returned. Attempted to update fields: ${updatedFieldsList}. API: ${apiMessage}`
        };
      }
    } catch (error) {
      let errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      logger.error(`Error in update-task tool: ${errorMessage}`, error instanceof Error ? error : undefined);

      // Check if it's a not found error based on API response structure or message
      // Note: ApiError from apiClient already provides a safeErrorMessage
      if (error instanceof Error && (error as any).status === 404) {
         errorMessage = `Task with number '${input.number}' not found.`;
      } else if (error instanceof Error && error.message.includes('not found')) { // Fallback for other not found indications
         errorMessage = `Task with number '${input.number}' not found or update failed.`;
      }
      
      return {
        isError: true,
        content: [{ type: "text", text: errorMessage }]
      };
    }
  }
}
