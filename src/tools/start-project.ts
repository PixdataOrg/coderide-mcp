/**
 * Start Project Tool
 * 
 * Retrieves task prompt from the first task of a project
 */
import { z } from 'zod';
import { BaseTool } from '../utils/base-tool';
import { apiClient } from '../utils/api-client';
import { logger } from '../utils/logger';

/**
 * Define the expected structure of the API response for getting tasks
 */
interface GetTasksResponse {
  tasks: any[]; // Assuming tasks is an array of any type for now
  count: number;
  // Add other expected fields from the API response if known
}

/**
 * Define the expected structure of the API response for getting projects
 */
interface GetProjectsResponse {
  projects: any[]; // Assuming projects is an array of any type for now
  count: number;
  // Add other expected fields from the API response if known
}

/**
 * Schema for the start-project tool input
 */
const StartProjectSchema = z.object({
  // Workspace ID (required for new API)
  workspaceId: z.string().describe("Workspace ID from CodeRide"),
  
  // Project slug (URL-friendly identifier)
  slug: z.string({
    required_error: "Project slug is required"
  }),
}).strict();

/**
 * Type for the start-project tool input
 */
type StartProjectInput = z.infer<typeof StartProjectSchema>;

/**
 * Start Project Tool Implementation
 */
export class StartProjectTool extends BaseTool<typeof StartProjectSchema> {
  readonly name = 'start_project';
  readonly description = 'Retrieve task prompt for the first task of a given project';
  readonly schema = StartProjectSchema;

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
        slug: {
          type: "string",
          description: "Project slug identifier (e.g., 'CFW')"
        }
      },
      required: ["workspaceId", "slug"]
    };
  }

  /**
   * Execute the start-project tool
   */
  async execute(input: StartProjectInput): Promise<unknown> {
    logger.info('Executing start-project tool', input);

    try {
      // Step 1: Find the project by slug
      const projectRequestBody: any = {
        workspaceId: input.workspaceId,
        slug: input.slug
      };
      
      const projectResponse = await apiClient.post('/v1/projects', projectRequestBody) as GetProjectsResponse;
      const projects = projectResponse.projects;
      
      if (!projects || projects.length === 0) {
        return {
          success: false,
          error: `Project with slug '${input.slug}' not found`,
          prompt: null
        };
      }
      
      const projectId = projects[0].id;
      
      // Step 2: Find the first task for this project
      const taskRequestBody: any = {
        workspaceId: input.workspaceId,
        projectId: projectId,
        sort: 'number:asc', // Sort by number ascending to get the first task
        limit: 1
      };
      
      const taskResponse = await apiClient.post('/v1/tasks', taskRequestBody) as GetTasksResponse;
      const tasks = taskResponse.tasks;
      
      if (!tasks || tasks.length === 0) {
        return {
          success: false,
          error: `No tasks found for project '${input.slug}'`,
          prompt: null
        };
      }
      
      // Step 3: Return the task_prompt field from the first task
      return {
        success: true,
        project: {
          slug: projects[0].slug,
          name: projects[0].name
        },
        task: {
          number: tasks[0].number,
          title: tasks[0].title,
          prompt: tasks[0].task_prompt || tasks[0].agentPrompt // Try both field names
        }
      };
    } catch (error) {
      logger.error('Error in start-project tool', error as Error);
      
      return {
        success: false,
        error: (error as Error).message,
        prompt: null
      };
    }
  }
}
