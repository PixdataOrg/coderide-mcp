/**
 * Start Project Tool
 * 
 * Retrieves task prompt from the first task of a project
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations } from '../utils/base-tool';
import { apiClient, StartProjectApiResponse } from '../utils/api-client'; // Import StartProjectApiResponse
import { logger } from '../utils/logger';

// Removed unused local interfaces TaskData, GetTasksResponse, ProjectData, GetProjectResponse

/**
 * Schema for the start-project tool input
 */
const StartProjectSchema = z.object({
  // Project slug (URL-friendly identifier)
  slug: z.string({
    required_error: "Project slug is required"
  })
  .regex(/^[A-Za-z]{3}$/, { message: "Project slug must be three letters (e.g., CRD or crd). Case insensitive." })
  .describe("Project slug identifier (e.g., 'CRD' or 'crd'). Case insensitive"),
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
  readonly description = "Retrieves the project details and the prompt for the very first task of a specified project using the project's unique slug (e.g., 'CRD'). This is useful for initiating work on a new project or understanding its starting point.";
  readonly zodSchema = StartProjectSchema; // Renamed from schema
  readonly annotations: ToolAnnotations = {
    title: "Start Project",
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
            pattern: "^[A-Za-z]{3}$",
            description: "The unique three-letter identifier for the project (e.g., 'CRD' or 'crd'). Case insensitive - will be converted to uppercase."
          }
        },
        required: ["slug"],
        additionalProperties: false
      }
    };
  }

  /**
   * Execute the start-project tool
   */
  async execute(input: StartProjectInput): Promise<unknown> {
    logger.info('Executing start-project tool', input);

    try {
      // Get the first task of the project using the new endpoint
      const url = `/project/slug/${input.slug.toUpperCase()}/first-task`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await apiClient.get<StartProjectApiResponse>(url) as unknown as StartProjectApiResponse;
      // const responseData: StartProjectApiResponse = axiosResponse.data; // This was the previous incorrect line
      
      if (!responseData || responseData.error) { 
        const errorMessage = responseData?.error || `Failed to get first task for project '${input.slug}' (no data or error in response).`;
        logger.warn(`Error in start-project tool: ${errorMessage}`, { responseData });
        return {
          isError: true,
          content: [{ type: "text", text: errorMessage }]
        };
      }
      
      // Return data structured according to the new schema
      return {
        project: {
          slug: responseData.project?.slug || '',
          name: responseData.project?.name || ''
        },
        task: {
          number: responseData.task?.number || '',
          title: responseData.task?.title || '',
          prompt: responseData.task?.prompt || '' // Access 'prompt' and output as 'prompt'
        }
      };
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      logger.error(`Error in start-project tool: ${errorMessage}`, error instanceof Error ? error : undefined);
      
      return {
        isError: true,
        content: [{ type: "text", text: errorMessage }]
      };
    }
  }
}
