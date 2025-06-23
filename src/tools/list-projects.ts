/**
 * List Projects Tool
 * 
 * Retrieves all projects in the workspace from the CodeRide API
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations } from '../utils/base-tool';
import { apiClient } from '../utils/api-client';
import { logger } from '../utils/logger';
import { env } from '../utils/env';

/**
 * API Response interface for list projects
 */
interface ListProjectsApiResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status?: string;
  icon?: string;
  workspace_id: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

/**
 * Schema for the list-projects tool input
 * No input parameters needed - workspace is determined from API key
 */
const ListProjectsSchema = z.object({}).strict();

/**
 * Type for the list-projects tool input
 */
type ListProjectsInput = z.infer<typeof ListProjectsSchema>;

/**
 * List Projects Tool Implementation
 */
export class ListProjectsTool extends BaseTool<typeof ListProjectsSchema> {
  readonly name = 'list_projects';
  readonly description = "Retrieves all projects in the workspace linked to the API key. No input parameters required - the workspace is automatically determined from the API key authentication.";
  readonly zodSchema = ListProjectsSchema;
  readonly annotations: ToolAnnotations = {
    title: "List Projects",
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
        additionalProperties: false
      }
    };
  }

  /**
   * Execute the list-projects tool
   */
  async execute(input: ListProjectsInput): Promise<unknown> {
    logger.info('Executing list-projects tool');

    try {
      // The current API requires workspaceId in the URL: /project/list/:workspaceId
      // But we need to extract workspaceId from the API key validation
      // 
      // Current limitation: The existing endpoint /project/list/:workspaceId requires
      // the workspaceId to be provided explicitly, but we only have the API key.
      // 
      // Solution: The backend team needs to implement /project/list endpoint
      // that extracts workspaceId from API key validation (as documented)
      
      // For now, we'll return a helpful error message explaining the limitation
      // and what needs to be implemented
      
      logger.warn('list-projects tool cannot be implemented with current API structure');
      
      return {
        isError: true,
        content: [{ 
          type: "text", 
          text: "The list-projects tool requires the backend to implement GET /project/list endpoint (without workspaceId parameter) that extracts the workspace from API key validation. Current endpoint /project/list/:workspaceId requires explicit workspaceId which cannot be provided by MCP tools. Please refer to docs/missing-api-endpoints.md section 2.A for implementation details." 
        }]
      };
      
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      logger.error(`Error in list-projects tool: ${errorMessage}`, error instanceof Error ? error : undefined);
      
      return {
        isError: true,
        content: [{ type: "text", text: errorMessage }]
      };
    }
  }
}
