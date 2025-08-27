/**
 * Next Task Tool
 * 
 * Retrieves the next task in sequence from the CodeRide API
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations } from '../utils/base-tool.js';
import { SecureApiClient, NextTaskApiResponse } from '../utils/secure-api-client.js';
import { logger } from '../utils/logger.js';

/**
 * Schema for the next-task tool input
 */
const NextTaskSchema = z.object({
  // Task number (e.g., "CDB-23")
  number: z.string({
    required_error: "Task number is required"
  }).regex(/^[A-Za-z]{3}-\d+$/, { message: "Task number must be in the format ABC-123 (e.g., CDB-23 or cdb-23). Case insensitive." }),
}).strict();

/**
 * Type for the next-task tool input
 */
type NextTaskInput = z.infer<typeof NextTaskSchema>;

/**
 * Next Task Tool Implementation
 */
export class NextTaskTool extends BaseTool<typeof NextTaskSchema> {
  readonly name = 'next_task';
  readonly description = "Retrieves the next task in sequence based on the current task number (e.g., CDB-23 → CDB-24). This is useful for finding the next task that needs to be done in a project workflow.";
  readonly zodSchema = NextTaskSchema;
  readonly annotations: ToolAnnotations = {
    title: "Next Task",
    readOnlyHint: true,
    openWorldHint: true, // Interacts with an external API
  };

  /**
   * Constructor with dependency injection
   */
  constructor(apiClient?: SecureApiClient) {
    super(apiClient);
  }

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
            description: "The current task number to find the next task for (e.g., 'CDB-23' or 'cdb-23'). Case insensitive - will be converted to uppercase."
          }
        },
        required: ["number"],
        additionalProperties: false
      }
    };
  }

  /**
   * Execute the next-task tool
   */
  async execute(input: NextTaskInput): Promise<unknown> {
    logger.info('Executing next-task tool', input);

    try {
      // Use the injected API client to get next task
      if (!this.apiClient) {
        throw new Error('API client not available - tool not properly initialized');
      }

      const url = `/task/number/${input.number.toUpperCase()}/next`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await this.apiClient.get<NextTaskApiResponse>(url) as unknown as NextTaskApiResponse;
      
      if (!responseData) {
        logger.warn(`No next task found for ${input.number} from ${url}`);
        return {
          isError: true,
          content: [{ type: "text", text: `No next task found after '${input.number}'` }]
        };
      }
      
      // Extract project slug and calculate sequence info
      const currentProjectSlug = input.number.toUpperCase().split('-')[0];
      const currentNumber = parseInt(input.number.split('-')[1]);
      const nextNumber = currentNumber + 1;
      
      // Return formatted next task details
      return {
        currentTask: {
          number: input.number.toUpperCase(),
          projectSlug: currentProjectSlug,
          sequenceNumber: currentNumber
        },
        nextTask: {
          number: responseData.number,
          title: responseData.title,
          description: responseData.description,
          status: responseData.status,
          priority: responseData.priority,
          sequenceNumber: nextNumber,
          hasContext: !!responseData.context,
          hasInstructions: !!responseData.instructions
        },
        sequenceInfo: {
          projectSlug: currentProjectSlug,
          progression: `${input.number.toUpperCase()} → ${responseData.number}`,
          increment: 1
        }
      };
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      logger.error(`Error in next-task tool: ${errorMessage}`, error instanceof Error ? error : undefined);
      
      // Provide more specific error messages based on common scenarios
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('not found')) {
        const projectSlug = input.number.toUpperCase().split('-')[0];
        const currentNumber = parseInt(input.number.split('-')[1]);
        const expectedNext = `${projectSlug}-${currentNumber + 1}`;
        userFriendlyMessage = `Next task '${expectedNext}' not found. This might be the last task in the project or the next task hasn't been created yet.`;
      }
      
      return {
        isError: true,
        content: [{ type: "text", text: userFriendlyMessage }]
      };
    }
  }
}
