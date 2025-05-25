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
interface TaskData {
  number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  agent?: string;
  agentPrompt?: string;
  task_prompt?: string;
  context?: string;
  instructions?: string;
  // Include other relevant fields if the API returns them
}

interface GetTasksResponse {
  tasks?: TaskData[];
  count?: number;
}

/**
 * Define the expected structure of the API response for getting projects
 */
interface ProjectData {
  slug: string;
  name: string;
  description: string;
  // Include other relevant fields if the API returns them
}

interface GetProjectResponse {
  slug?: string;
  name?: string;
  description?: string;
  // Add other expected fields from the API response if known
}

/**
 * Schema for the start-project tool input
 */
const StartProjectSchema = z.object({
  // Project slug (URL-friendly identifier)
  slug: z.string({
    required_error: "Project slug is required"
  }).describe("Project slug identifier (e.g., 'CFW')"),
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
        slug: {
          type: "string",
          description: "Project slug identifier (e.g., 'CFW')"
        }
      },
      required: ["slug"]
    };
  }

  /**
   * Execute the start-project tool
   */
  async execute(input: StartProjectInput): Promise<unknown> {
    logger.info('Executing start-project tool', input);

    try {
      // Get the first task of the project using the new endpoint
      const url = `/project/slug/${input.slug}/first-task`;
      logger.debug(`Making GET request to: ${url}`);
      
      const response = await apiClient.get(url) as any;
      
      if (!response || response.error) {
        return {
          success: false,
          error: response?.error || `Failed to get first task for project '${input.slug}'`,
          prompt: null
        };
      }
      
      // Return the response from the API
      return {
        success: true,
        project: response.project,
        task: response.task
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
