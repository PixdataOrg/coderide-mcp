/**
 * List Tasks Tool
 * 
 * Lists all tasks within a project by slug from the CodeRide API
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations, AgentInstructions } from '../utils/base-tool.js';
import { SecureApiClient, TaskListApiResponse } from '../utils/secure-api-client.js';
import { logger } from '../utils/logger.js';

/**
 * Schema for the list-tasks tool input
 */
const ListTasksSchema = z.object({
  // Project slug (URL-friendly identifier)
  slug: z.string({
    required_error: "Project slug is required"
  })
    .regex(/^[A-Za-z]{3}$/, { message: "Project slug must be three letters (e.g., CDB or cdb). Case insensitive." }),
}).strict();

/**
 * Type for the list-tasks tool input
 */
type ListTasksInput = z.infer<typeof ListTasksSchema>;

/**
 * List Tasks Tool Implementation
 */
export class ListTasksTool extends BaseTool<typeof ListTasksSchema> {
  readonly name = 'list_tasks';
  readonly description = "Lists all tasks within a project using the project slug (e.g., 'CDB'). Returns tasks organized by status columns with their order and current status. Use this when you need to see the full project backlog, identify tasks by status (to-do, in-progress, done), or plan your work sequence.";
  readonly zodSchema = ListTasksSchema;
  readonly annotations: ToolAnnotations = {
    title: "List Tasks",
    readOnlyHint: true,
    openWorldHint: true, // Interacts with an external API
  };
  readonly metadata = {
    category: 'task' as const,
    tags: ['task', 'list', 'project', 'status', 'read'],
    usage: 'Use when you need to see the full project backlog, identify tasks by status (to-do, in-progress, done), or plan your work sequence',
    priority: 'primary' as const
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
      metadata: this.metadata,
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            pattern: "^[A-Za-z]{3}$",
            description: "The unique three-letter project identifier/code (e.g., 'CDB' for a database project, 'CRD' for CodeRide). Returns all tasks organized by status columns (to-do, in-progress, done) with their sequence numbers and metadata. Case insensitive - will be converted to uppercase internally."
          }
        },
        required: ["slug"],
        additionalProperties: false
      }
    };
  }

  /**
   * Generate agent instructions for list_tasks tool
   */
  protected generateAgentInstructions(input: ListTasksInput, result: any): AgentInstructions {
    return {
      immediateActions: [
        "Review available tasks and their current status",
        "Help user select appropriate task to work on",
        "Consider task status (to-do, in-progress, completed) for workflow planning"
      ],
      nextRecommendedTools: ["get_project", "get_task"],
      workflowPhase: 'discovery',
      criticalReminders: [
        "Always establish project context before starting selected task",
        "Follow optimal workflow: get_project → get_task → get_prompt"
      ],
      automationHints: {
        taskSelection: "Guide user to select tasks based on priority and dependencies",
        workflowGuidance: "Ensure project context is established before task work begins"
      }
    };
  }

  /**
   * Execute the list-tasks tool
   */
  async execute(input: ListTasksInput): Promise<unknown> {
    logger.info('Executing list-tasks tool', input);

    try {
      // Use the injected API client to get task list
      if (!this.apiClient) {
        throw new Error('API client not available - tool not properly initialized');
      }

      const url = `/task/project/slug/${input.slug.toUpperCase()}`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await this.apiClient.get<TaskListApiResponse>(url) as unknown as TaskListApiResponse;
      
      if (!responseData) {
        logger.warn(`No project found or invalid response format from ${url}`);
        return {
          isError: true,
          content: [{ type: "text", text: `Project with slug '${input.slug}' not found` }]
        };
      }
      
      // Calculate total task count across all columns
      const totalTasks = responseData.columns?.reduce((total, column) => total + (column.tasks?.length || 0), 0) || 0;
      
      // Return formatted task list with project info and organized tasks
      return {
        project: {
          id: responseData.id,
          name: responseData.name,
          slug: responseData.slug,
          status: responseData.status
        },
        taskSummary: {
          totalTasks,
          statusBreakdown: responseData.columns?.map(column => ({
            status: column.id,
            name: column.name,
            count: column.tasks?.length || 0
          })) || []
        },
        tasksByStatus: responseData.columns?.map(column => ({
          status: column.id,
          name: column.name,
          tasks: column.tasks?.map(task => ({
            number: task.number,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            position: task.position,
            hasContext: !!task.context,
            hasInstructions: !!task.instructions
          })).sort((a, b) => {
            // Sort tasks by their number (e.g., CDB-1, CDB-2, CDB-3, etc.)
            const getTaskNumber = (taskNumber: string) => {
              const match = taskNumber.match(/^[A-Z]{3}-(\d+)$/);
              return match ? parseInt(match[1], 10) : 0;
            };
            return getTaskNumber(a.number) - getTaskNumber(b.number);
          }) || []
        })) || []
      };
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      logger.error(`Error in task-list tool: ${errorMessage}`, error instanceof Error ? error : undefined);
      
      return {
        isError: true,
        content: [{ type: "text", text: errorMessage }]
      };
    }
  }
}
