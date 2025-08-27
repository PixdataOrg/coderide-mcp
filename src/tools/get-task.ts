/**
 * Get Task Tool
 * 
 * Retrieves tasks from the CodeRide API with optional filtering
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations } from '../utils/base-tool.js';
import { secureApiClient, TaskApiResponse } from '../utils/secure-api-client.js'; // Use secure API client
import { logger } from '../utils/logger.js';

// Removed local GetTasksResponse and TaskData as TaskApiResponse from api-client.ts will be used.

/**
 * Schema for the get-task tool input
 */
const GetTaskSchema = z.object({
  // Task number (required)
  number: z.string()
    .regex(/^[A-Za-z]{3}-\d+$/, { message: "Task number must be in the format ABC-123 (e.g., CRD-1 or crd-1). Case insensitive." })
    .describe("Task number identifier (e.g., 'CRD-1')"),
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
  readonly description = "Retrieves detailed information for a specific task using its unique task number (e.g., 'CRD-1').";
  readonly zodSchema = GetTaskSchema; // Renamed from schema
  readonly annotations: ToolAnnotations = {
    title: "Get Task",
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
            pattern: "^[A-Za-z]{3}-\\d+$",
            description: "The unique task number identifier (e.g., 'CRD-1' or 'crd-1'). Case insensitive - will be converted to uppercase."
          }
        },
        required: ["number"],
        additionalProperties: false
      }
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
      // Note: The tool's input schema allows for limit, offset, status, agent,
      // but the URL constructed here only uses the task number.
      // If the API /task/number/:taskNumber supports these as query params, they should be added.
      // Example: const url = `/task/number/${input.number.toUpperCase()}?limit=${input.limit}&offset=${input.offset}`;
      // For now, assuming the endpoint only takes :taskNumber and returns a single task.
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await secureApiClient.get<TaskApiResponse>(url) as unknown as TaskApiResponse;
      // const responseData: TaskApiResponse = axiosResponse.data; // This was the previous incorrect line

      // If responseData is null, undefined, or an empty object,
      // optional chaining and fallbacks will produce an "empty task" structure.
      // This ensures that if the API call itself doesn't throw (e.g. 404, 500),
      // but returns no meaningful data, we provide a default empty structure.
      // The logger will still indicate if the response was truly empty if needed at a lower level.
      
      // Return only the specific properties requested, ensuring compact JSON
      return {
        number: responseData?.number || input.number || '', // Echo input number if API response is empty
        title: responseData?.title || '',
        description: responseData?.description || '',
        status: responseData?.status || '',
        priority: responseData?.priority || '',
        agent: responseData?.agent || '',
        agent_prompt: responseData?.agent_prompt || '',
        context: responseData?.context || '',
        instructions: responseData?.instructions || ''
      };
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      logger.error(`Error in get-task tool: ${errorMessage}`, error instanceof Error ? error : undefined);
      
      return {
        isError: true,
        content: [{ type: "text", text: errorMessage }]
      };
    }
  }
}
