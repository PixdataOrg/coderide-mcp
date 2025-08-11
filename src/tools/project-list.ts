/**
 * Project List Tool
 * 
 * Lists all projects in the user workspace from the CodeRide API
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations } from '../utils/base-tool';
import { apiClient, ProjectListApiResponse } from '../utils/api-client';
import { logger } from '../utils/logger';

/**
 * Schema for the project-list tool input
 * No input parameters required - workspace is extracted from API key
 */
const ProjectListSchema = z.object({}).strict();

/**
 * Type for the project-list tool input
 */
type ProjectListInput = z.infer<typeof ProjectListSchema>;

/**
 * Project List Tool Implementation
 */
export class ProjectListTool extends BaseTool<typeof ProjectListSchema> {
  readonly name = 'project_list';
  readonly description = "Lists all projects in the user workspace. No input parameters required as the workspace is automatically determined from the API key authentication.";
  readonly zodSchema = ProjectListSchema;
  readonly annotations: ToolAnnotations = {
    title: "Project List",
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
        properties: {},
        required: [],
        additionalProperties: false
      }
    };
  }

  /**
   * Execute the project-list tool
   */
  async execute(input: ProjectListInput): Promise<unknown> {
    logger.info('Executing project-list tool', input);

    try {
      const url = `/project/list`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await apiClient.get<ProjectListApiResponse[]>(url) as unknown as ProjectListApiResponse[];
      
      if (!responseData || !Array.isArray(responseData)) {
        logger.warn(`No projects found or invalid response format from ${url}`);
        return { projects: [] };
      }
      
      // Return formatted project list
      return {
        projects: responseData.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          slug: project.slug,
         // status: project.status || 'draft', // Fallback for projects without status
          workspace: {
            id: project.workspace?.id || '',
            name: project.workspace?.name || ''
          }
        })),
        totalCount: responseData.length
      };
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      logger.error(`Error in project-list tool: ${errorMessage}`, error instanceof Error ? error : undefined);
      
      return {
        isError: true,
        content: [{ type: "text", text: errorMessage }]
      };
    }
  }
}
