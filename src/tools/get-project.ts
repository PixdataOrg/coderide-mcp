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
  slug: z.string({
    required_error: "Project slug is required"
  })
    .regex(/^[A-Z]{3}$/, { message: "Project slug must be three uppercase letters (e.g., CRD)." }),
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
  readonly description = "Retrieves detailed information about a specific project using its unique 'slug' (three uppercase letters, e.g., 'CRD').";
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
            description: "The unique three-letter uppercase identifier for the project (e.g., 'CRD')."
          }
        },
        required: ["slug"],
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
      const url = `/project/slug/${input.slug}`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await apiClient.get<ProjectApiResponse>(url) as unknown as ProjectApiResponse;
      
      // Return project data according to the new schema
      return {
        slug: responseData?.slug || '', 
        name: responseData?.name || '',
        description: responseData?.description || '',
        projectKnowledge: responseData?.projectKnowledge || {}, // Changed to camelCase
        projectDiagram: responseData?.projectDiagram || '', // Changed to camelCase
        projectStandards: responseData?.projectStandards || {} // Assuming project_standards is also camelCase from API
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
