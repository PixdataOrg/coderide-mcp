/**
 * Get Project Tool
 * 
 * Retrieves project information from the CodeRide API
 */
import { z } from 'zod';
import { BaseTool } from '../utils/base-tool';
import { apiClient } from '../utils/api-client'; // Import the new API client
import { logger } from '../utils/logger';

/**
 * Define the expected structure of the API response for getting projects
 */
interface ProjectData {
  slug: string;
  name: string;
  description: string;
  // Include other relevant fields if the API returns them
}

interface GetProjectsResponse {
  projects?: ProjectData[];
  count?: number;
  // Single project response fields
  slug?: string;
  name?: string;
  description?: string;
  // Add other expected fields from the API response if known
}

/**
 * Schema for the get-project tool input
 */
const GetProjectSchema = z.object({
  // Project slug (URL-friendly identifier)
  slug: z.string().describe("Project identifier"),
  
  // Project name
  name: z.string().optional().describe("Project display name"),
  
  // Project description (for search)
  description: z.string().optional().describe("Project description"),
}).strict();

/**
 * Type for the get-project tool input
 */
type GetProjectInput = z.infer<typeof GetProjectSchema>;

/**
 * Get Project Tool Implementation
 */
export class GetProjectTool extends BaseTool<typeof GetProjectSchema> {
  readonly name = 'get_project';
  readonly description = 'Retrieve project information by slug or name';
  readonly schema = GetProjectSchema;

  /**
   * Get input schema for documentation
   */
  getInputSchema(): Record<string, any> {
    return {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Project identifier"
        },
        name: {
          type: "string",
          description: "Project display name"
        },
        description: {
          type: "string",
          description: "Project description"
        }
      },
      required: ["slug"]
    };
  }

  /**
   * Execute the get-project tool
   */
  async execute(input: GetProjectInput): Promise<unknown> {
    logger.info('Executing get-project tool', input);

    try {
      // Use the API client to get project by slug
      const url = `/project/slug/${input.slug}`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await apiClient.get(url) as GetProjectsResponse;
      
      // Handle both array and single object responses
      let projects: ProjectData[] = [];
      
      if (responseData.projects) {
        // Response contains a projects array
        projects = responseData.projects;
      } else if (responseData.slug) {
        // Response is a single project object
        projects = [{
          slug: responseData.slug,
          name: responseData.name || '',
          description: responseData.description || ''
        }];
      }
      
      // Return formatted response with only the requested fields
      return {
        success: true,
        count: projects.length,
        projects: projects
      };
    } catch (error) {
      logger.error('Error in get-project tool', error as Error);
      
      return {
        success: false,
        error: (error as Error).message,
        projects: []
      };
    }
  }
}
