/**
 * List Projects Tool
 * 
 * Lists all projects in the user workspace from the CodeRide API
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations, AgentInstructions } from '../utils/base-tool.js';
import { SecureApiClient, ProjectListApiResponse } from '../utils/secure-api-client.js';
import { logger } from '../utils/logger.js';

/**
 * Schema for the list-projects tool input
 * No input parameters required - workspace is extracted from API key
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
  readonly description = "Lists all projects in the user workspace. No input parameters required as the workspace is automatically determined from the API key authentication. Use this when you need to discover available projects, find a project slug, or get an overview of all projects you have access to.";
  readonly zodSchema = ListProjectsSchema;
  readonly annotations: ToolAnnotations = {
    title: "List Projects",
    readOnlyHint: true,
    openWorldHint: true, // Interacts with an external API
  };
  readonly metadata = {
    category: 'project' as const,
    tags: ['project', 'list', 'workspace', 'discovery', 'read'],
    usage: 'Use when you need to discover available projects, find a project slug, or get an overview of all projects you have access to',
    priority: 'primary' as const
  };

  /**
   * Constructor with dependency injection
   */
  constructor(apiClient?: SecureApiClient) {
    super(apiClient);
  }

  /**
   * Returns the full tool definition conforming to MCP.
   */
  getMCPToolDefinition(): MCPToolDefinition {
    return {
      name: this.name,
      description: this.description,
      annotations: this.annotations,
      metadata: this.metadata,
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false
      }
    };
  }

  /**
   * Generate agent instructions for list_projects tool
   */
  protected generateAgentInstructions(input: ListProjectsInput, result: any): AgentInstructions {
    return {
      immediateActions: [
        "Review available projects and their descriptions",
        "Help user select appropriate project for their work",
        "Consider project scope and current status for selection"
      ],
      nextRecommendedTools: ["start_project", "get_project"],
      workflowPhase: 'discovery',
      criticalReminders: [
        "Use start_project for new project initialization",
        "Use get_project to understand existing project context"
      ],
      automationHints: {
        projectSelection: "Guide user to select projects based on their current objectives",
        workflowGuidance: {
          newProject: "Use start_project for project initialization",
          existingProject: "Use get_project to establish project context"
        }
      }
    };
  }

  /**
   * Execute the list-projects tool
   */
  async execute(input: ListProjectsInput): Promise<unknown> {
    logger.info('Executing list-projects tool', input);

    try {
      // Use the injected API client to get project list
      if (!this.apiClient) {
        throw new Error('API client not available - tool not properly initialized');
      }

      const url = `/project/list`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await this.apiClient.get<ProjectListApiResponse[]>(url) as unknown as ProjectListApiResponse[];
      
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
