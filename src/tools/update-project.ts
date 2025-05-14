/**
 * Update Project Tool
 * 
 * Updates project knowledge and diagram using the CodeRide API
 */
import { z } from 'zod';
import { BaseTool } from '../utils/base-tool';
import { apiClient } from '../utils/api-client'; // Import the new API client
import { logger } from '../utils/logger';

/**
 * Define the expected structure of the API response for updating projects
 */
interface UpdateProjectResponse {
  success: boolean;
  message?: string;
  project?: { // Assuming the API returns the updated project
    slug: string;
    name: string;
    description: string;
    project_knowledge?: object;
    project_diagram?: string;
    // Include other relevant fields if the API returns them
  };
  notFound?: boolean;
}

/**
 * Schema for the update-project tool input
 */
const UpdateProjectSchema = z.object({
  // Workspace ID (required for new API)
  workspaceId: z.string().describe("Workspace ID from CodeRide"),

  // Required field to identify the project
  slug: z.string({
    required_error: "Project slug is required to identify the project",
    invalid_type_error: "Project slug must be a string"
  }),
  
  // Optional fields that can be updated
  project_knowledge: z.record(z.any()).optional(),
  project_diagram: z.string().optional(),
}).strict().refine(
  // Ensure at least one field to update is provided
  (data) => {
    const updateFields = ['project_knowledge', 'project_diagram'];
    return updateFields.some(field => field in data);
  },
  {
    message: 'At least one field to update must be provided',
    path: ['updateFields']
  }
);

/**
 * Type for the update-project tool input
 */
type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

/**
 * Update Project Tool Implementation
 */
export class UpdateProjectTool extends BaseTool<typeof UpdateProjectSchema> {
  readonly name = 'update_project';
  readonly description = 'Update project knowledge and diagram';
  readonly schema = UpdateProjectSchema;
  
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
          description: "Project slug to identify the project to update"
        },
        project_knowledge: {
          type: "object",
          description: "Project knowledge graph data (JSON object)"
        },
        project_diagram: {
          type: "string",
          description: "Project structure diagram (Mermaid.js format)"
        }
      },
      required: ["workspaceId", "slug"] // workspaceId is now required
    };
  }

  /**
   * Execute the update-project tool
   */
  async execute(input: UpdateProjectInput): Promise<unknown> {
    logger.info('Executing update-project tool', input);

    try {
      // Extract project slug and workspace ID
      const { slug, workspaceId, ...updateData } = input;
      
      // The new API updates by ID, so we need to get the project first to find the ID
      // Using the get-project endpoint to find the project by slug and workspaceId
      const getProjectResponse = await apiClient.post('/v1/projects', {
        workspaceId: workspaceId,
        slug: slug
      }) as { projects: { id: string }[] }; // Assuming the get projects endpoint returns an array with id

      if (!getProjectResponse || !getProjectResponse.projects || getProjectResponse.projects.length === 0) {
        return {
          success: false,
          error: `Project with slug ${slug} not found in workspace ${workspaceId}`,
          notFound: true
        };
      }
      
      const projectId = getProjectResponse.projects[0].id;
      
      // Update project using the new API endpoint
      const responseData = await apiClient.put(`/v1/projects/${projectId}`, {
        workspaceId: workspaceId, // Include workspaceId in the update body as well, based on Postman
        ...updateData
      }) as UpdateProjectResponse; // Cast the response data

      // Return formatted response
      return {
        success: responseData.success,
        message: responseData.message || 'Project updated successfully',
        project: responseData.project
      };
    } catch (error) {
      logger.error('Error in update-project tool', error as Error);
      
      // Check if it's a not found error based on API response structure or message
      const isNotFoundError = (error as any).notFound || (error as Error).message.includes('not found');
      
      return {
        success: false,
        error: (error as Error).message,
        notFound: isNotFoundError
      };
    }
  }
}
