/**
 * Get Prompt Tool
 * 
 * Retrieves task prompt from the CodeRide API for a specific task
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations, AgentInstructions } from '../utils/base-tool.js';
import { SecureApiClient, TaskApiResponse } from '../utils/secure-api-client.js';
import { logger } from '../utils/logger.js';

/**
 * Schema for the get-prompt tool input
 */
const GetPromptSchema = z.object({
  // Task number (e.g., "CRD-1")
  number: z.string({
    required_error: "Task number is required"
  }).regex(/^[A-Za-z]{3}-\d+$/, { message: "Task number must be in the format ABC-123 (e.g., CRD-1 or crd-1). Case insensitive." }),
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
  readonly description = "Retrieves the specific instructions or prompt for a given task, identified by its unique task number (e.g., 'CRD-1'). Use this when you need detailed implementation guidance, acceptance criteria, or AI-specific instructions for completing a task after reviewing the basic task details.";
  readonly zodSchema = GetPromptSchema; // Renamed from schema
  readonly annotations: ToolAnnotations = {
    title: "Get Task Prompt",
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
   * Override to require project context before accessing prompts
   */
  requiresProjectContext(): boolean {
    return true;
  }

  /**
   * Generate agent-specific instructions for prompt retrieval workflow
   */
  generateAgentInstructions(): AgentInstructions {
    return {
      immediateActions: [
        'Retrieve detailed task implementation instructions',
        'Analyze prompt requirements and constraints',
        'Prepare implementation strategy based on prompt guidance'
      ],
      nextRecommendedTools: ['update_task', 'update_project'],
      workflowPhase: 'implementation',
      prerequisiteValidation: {
        required: ['get_project', 'get_task'],
        onMissing: 'Task context required - call get_project and get_task first to establish context before accessing prompt'
      },
      statusUpdateRequired: true,
      contextRequired: ['task_details', 'project_knowledge'],
      statusAwareGuidance: {
        'to-do': {
          actions: [
            'Read prompt instructions carefully',
            'Update task status to "in-progress" immediately',
            'Begin implementation following prompt guidance'
          ],
          nextTools: ['update_task']
        },
        'in-progress': {
          actions: [
            'Review prompt for additional guidance',
            'Continue implementation based on prompt instructions',
            'Update progress as work advances'
          ],
          nextTools: ['update_task']
        },
        'completed': {
          actions: [
            'Review prompt to ensure all requirements met',
            'Update project knowledge with implementation impacts',
            'Move to next task in sequence'
          ],
          nextTools: ['update_project', 'next_task']
        }
      },
      workflowCorrection: {
        correctSequence: ['get_project', 'get_task', 'get_prompt', 'update_task'],
        redirectMessage: 'Prompt access requires task context. Ensure get_project and get_task have been called first.'
      },
      criticalReminders: [
        'This prompt contains detailed implementation instructions - follow them precisely',
        'Update task status to "in-progress" immediately after reading prompt',
        'Use prompt guidance to inform all implementation decisions'
      ]
    };
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
            description: "The unique identifier for the task (e.g., 'CRD-1' or 'crd-1'). Case insensitive - will be converted to uppercase."
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
      // Use the injected API client to get task prompt
      if (!this.apiClient) {
        throw new Error('API client not available - tool not properly initialized');
      }

      // Get the task prompt using the specific endpoint /task/number/:taskNumber/prompt
      const taskNumber = input.number.toUpperCase(); // Convert to uppercase for consistency
      const url = `/task/number/${taskNumber}/prompt`; 
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await this.apiClient.get<TaskApiResponse>(url) as unknown as TaskApiResponse;
      
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
