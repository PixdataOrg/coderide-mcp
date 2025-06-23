/**
 * Get Project Tool
 * 
 * Retrieves project information from the CodeRide API
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations } from '../utils/base-tool';
import { apiClient, ProjectApiResponse } from '../utils/api-client'; // Import ProjectApiResponse
import { logger } from '../utils/logger';

/**
 * Schema for the get-project tool input
 */
const GetProjectSchema = z.object({
  // Project slug (URL-friendly identifier)
  slug: z.string()
    .regex(/^[A-Z]{3}$/, { message: "Project slug must be three uppercase letters (e.g., GFW)." })
    .optional(),
  
  // Project name
  name: z.string().optional()
}).strict()
.refine(
  // Ensure at least one search parameter is provided
  (data) => data.slug !== undefined || data.name !== undefined,
  {
    message: 'At least one search parameter (slug or name) must be provided',
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
  readonly description = "Retrieves detailed information about a specific project using its unique 'slug' (three uppercase letters, e.g., 'CFW').";
  readonly zodSchema = GetProjectSchema; // Renamed from schema
  readonly annotations: ToolAnnotations = {
    title: "Get Project",
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
            description: "The unique three-letter uppercase identifier for the project (e.g., 'CFW'). If provided, this will be used for a direct lookup."
          },
          name: {
            type: "string",
            description: "The display name of the project. Use for searching if the exact slug is unknown."
          }
        },
        // This anyOf implies that if you provide one, it's a valid way to call the tool.
        // The Zod .refine() handles the "at least one" logic at runtime.
        anyOf: [
          { required: ["slug"] },
          { required: ["name"] }
        ],
        additionalProperties: false
      }
    };
  }

  /**
   * Execute the get-project tool
   */
  async execute(input: GetProjectInput): Promise<unknown> {
    logger.info('Executing get-project tool', input);

    try {
      // For now, we'll use the slug-based endpoint if slug is provided
      // In the future, the API might support search by name/description
      if (input.slug) {
        const url = `/project/slug/${input.slug}`;
        logger.debug(`Making GET request to: ${url}`);
        
        const responseData = await apiClient.get<ProjectApiResponse>(url) as unknown as ProjectApiResponse;
        // const responseData: ProjectApiResponse = axiosResponse.data; // This was the previous incorrect line
        
        // Return project data according to the new schema
        return {
          slug: responseData?.slug || '', 
          name: responseData?.name || '',
          description: responseData?.description || '',
          projectKnowledge: responseData?.projectKnowledge || {}, // Changed to camelCase
          projectDiagram: responseData?.projectDiagram || '', // Changed to camelCase
          projectStandards: responseData?.projectStandards || {} // Assuming project_standards is also camelCase from API
        };
      }
      
      // If searching by name, we'd need different API endpoints
      // For now, return an error or appropriate message as the tool currently only supports slug lookup.
      logger.warn('GetProjectTool called without a slug. Name search not yet implemented.');
      return {
        isError: true,
        content: [{ type: "text", text: "Project lookup by name is not yet supported. Please provide a slug." }]
      };
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      logger.error(`Error in get-project tool: ${errorMessage}`, error instanceof Error ? error : undefined);
      
      return {
        isError: true,
        content: [{ type: "text", text: errorMessage }]
      };
    }
  }
}
