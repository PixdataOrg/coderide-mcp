/**
 * Get Task Tool
 * 
 * Retrieves tasks from the CodeRide API with optional filtering
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations, AgentInstructions } from '../utils/base-tool.js';
import { SecureApiClient, TaskApiResponse } from '../utils/secure-api-client.js';
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
   * Constructor with dependency injection
   */
  constructor(apiClient?: SecureApiClient) {
    super(apiClient);
  }

  /**
   * Override to require project context before task analysis
   */
  requiresProjectContext(): boolean {
    return true;
  }

  /**
   * Generate agent-specific instructions for task analysis workflow
   */
  generateAgentInstructions(): AgentInstructions {
    return {
      immediateActions: [
        'Analyze task details and requirements',
        'Verify task status and priority',
        'Prepare for implementation planning'
      ],
      nextRecommendedTools: ['get_prompt', 'update_task'],
      workflowPhase: 'analysis',
      prerequisiteValidation: {
        required: ['get_project'],
        onMissing: 'Project context required - call get_project first to establish context before task analysis'
      },
      statusUpdateRequired: true,
      contextRequired: ['project_knowledge', 'project_diagram'],
      statusAwareGuidance: {
        'to-do': {
          actions: [
            'Read task details carefully',
            'Call get_prompt for detailed instructions',
            'Update status to "in-progress" via update_task',
            'Begin implementation'
          ],
          nextTools: ['get_prompt', 'update_task']
        },
        'in-progress': {
          actions: [
            'Review current task state',
            'Check if additional context needed via get_prompt',
            'Continue with implementation',
            'Update progress as needed'
          ],
          nextTools: ['get_prompt', 'update_task']
        },
        'completed': {
          actions: [
            'Review completed work',
            'Verify task requirements were met',
            'Consider calling next_task for workflow continuation'
          ],
          nextTools: ['next_task', 'update_project']
        }
      },
      workflowCorrection: {
        correctSequence: ['get_project', 'get_task', 'get_prompt', 'update_task'],
        redirectMessage: 'Task analysis requires project context. Call get_project first, then get_task, then get_prompt for detailed instructions.'
      },
      criticalReminders: [
        'Always call get_prompt after get_task to retrieve detailed implementation guidance',
        'Update task status to "in-progress" immediately when starting work',
        'Ensure project context is established before task analysis'
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
      // Use the injected API client to get task by number
      if (!this.apiClient) {
        throw new Error('API client not available - tool not properly initialized');
      }

      const url = `/task/number/${input.number.toUpperCase()}`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await this.apiClient.get<TaskApiResponse>(url) as unknown as TaskApiResponse;

      // If responseData is null, undefined, or an empty object,
      // optional chaining and fallbacks will produce an "empty task" structure.
      // This ensures that if the API call itself doesn't throw (e.g. 404, 500),
      // but returns no meaningful data, we provide a default empty structure.
      
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
