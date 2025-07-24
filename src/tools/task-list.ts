/**
 * Task List Tool
 * 
 * Lists all tasks within a project by slug from the CodeRide API
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations } from '../utils/base-tool';
import { apiClient, TaskListApiResponse } from '../utils/api-client';
import { logger } from '../utils/logger';

/**
 * Schema for the task-list tool input
 */
const TaskListSchema = z.object({
  // Project slug (URL-friendly identifier)
  slug: z.string({
    required_error: "Project slug is required"
  })
    .regex(/^[A-Z]{3}$/, { message: "Project slug must be three uppercase letters (e.g., CDB)." }),
}).strict();

/**
 * Type for the task-list tool input
 */
type TaskListInput = z.infer<typeof TaskListSchema>;

/**
 * Task List Tool Implementation
 */
export class TaskListTool extends BaseTool<typeof TaskListSchema> {
  readonly name = 'task_list';
  readonly description = "Lists all tasks within a project using the project slug (e.g., 'CDB'). Returns tasks organized by status columns with their order and current status.";
  readonly zodSchema = TaskListSchema;
  readonly annotations: ToolAnnotations = {
    title: "Task List",
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
          slug: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "The unique three-letter uppercase identifier for the project (e.g., 'CDB')."
          }
        },
        required: ["slug"],
        additionalProperties: false
      }
    };
  }

  /**
   * Execute the task-list tool
   */
  async execute(input: TaskListInput): Promise<unknown> {
    logger.info('Executing task-list tool', input);

    try {
      const url = `/task/project/slug/${input.slug}`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await apiClient.get<TaskListApiResponse>(url) as unknown as TaskListApiResponse;
      
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
            dueDate: task.dueDate,
            assigneeEmail: task.assigneeEmail,
            assigneeName: task.assigneeName,
            createdAt: task.createdAt,
            hasContext: !!task.context,
            hasInstructions: !!task.instructions
          })) || []
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
