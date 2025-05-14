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
interface GetProjectsResponse {
  projects: { // Assuming projects is an array of objects with these properties
    slug: string;
    name: string;
    description: string;
    // Include other relevant fields if the API returns them
  }[];
  count: number;
  // Add other expected fields from the API response if known
}

/**
 * Schema for the get-project tool input
 */
const GetProjectSchema = z.object({
  // Workspace ID (required for new API)
  workspaceId: z.string().describe("Workspace ID from CodeRide"),

  // Project slug (URL-friendly identifier)
  slug: z.string().optional(),
  
  // Project name
  name: z.string().optional(),
  
  // Project description (for search)
  description: z.string().optional(),
}).strict()
.refine(
  // Ensure at least one search parameter is provided (excluding workspaceId)
  (data) => data.slug !== undefined || data.name !== undefined || data.description !== undefined,
  {
    message: 'At least one search parameter (slug, name, or description) must be provided',
    path: ['searchParameters']
  }
);

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
        workspaceId: {
          type: "string",
          description: "Workspace ID from CodeRide"
        },
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
      required: ["workspaceId"], // workspaceId is now required
      anyOf: [ // Still require at least one search parameter among slug, name, description
        { required: ["slug"] },
        { required: ["name"] },
        { required: ["description"] }
      ]
    };
  }

  /**
   * Execute the get-project tool
   */
  async execute(input: GetProjectInput): Promise<unknown> {
    logger.info('Executing get-project tool', input);

    try {
      const requestBody: any = {
        workspaceId: input.workspaceId,
      };
      
      // Add search parameters if provided
      if (input.slug) {
        requestBody.slug = input.slug;
      }
      
      if (input.name) {
        requestBody.name = input.name;
      }
      
      if (input.description) {
        requestBody.description = input.description;
      }
      
      // Use the new API client to get projects and cast the response data
      const responseData = await apiClient.post('/v1/projects', requestBody) as GetProjectsResponse;
      const projects = responseData.projects; // Access projects from the casted response data
      
      // Return formatted response with only the requested fields
      return {
        success: true,
        count: projects.length,
        projects: projects.map(project => ({
          slug: project.slug,
          name: project.name,
          description: project.description
        }))
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
