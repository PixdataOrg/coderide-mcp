/**
 * Get Project Tool
 * 
 * Retrieves project information from the CodeRide API
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations, AgentInstructions } from '../utils/base-tool.js';
import { SecureApiClient, ProjectApiResponse } from '../utils/secure-api-client.js';
import { logger } from '../utils/logger.js';

/**
 * Schema for the get-project tool input
 */
const GetProjectSchema = z.object({
  // Project slug (URL-friendly identifier)
  slug: z.string({
    required_error: "Project slug is required"
  })
    .regex(/^[A-Za-z]{3}$/, { message: "Project slug must be three letters (e.g., CRD or crd). Case insensitive." }),
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
  readonly description = "Retrieves detailed information about a specific project using its unique 'slug' (three uppercase letters, e.g., 'CRD'). Use this at the start of your workflow to establish project context, understand the codebase architecture, and access the knowledge graph and architecture diagrams before working on tasks.";
  readonly zodSchema = GetProjectSchema; // Renamed from schema
  readonly annotations: ToolAnnotations = {
    title: "Get Project",
    readOnlyHint: true,
    openWorldHint: true, // Interacts with an external API
  };
  readonly metadata = {
    category: 'project' as const,
    tags: ['project', 'fetch', 'details', 'knowledge', 'read'],
    usage: 'Use at the start of your workflow to establish project context, understand the codebase architecture, and access the knowledge graph and architecture diagrams before working on tasks',
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
        properties: {
          slug: {
            type: "string",
            pattern: "^[A-Za-z]{3}$",
            description: "The unique three-letter project identifier/code (e.g., 'CRD' for CodeRide, 'CDB' for a database project). This slug serves as the project prefix for all task numbers (e.g., CRD-1, CRD-2). Case insensitive - will be converted to uppercase internally. This is the same prefix seen in task numbers."
          }
        },
        required: ["slug"],
        additionalProperties: false
      }
    };
  }

  /**
   * Generate agent instructions for get_project tool
   */
  protected generateAgentInstructions(input: GetProjectInput, result: any): AgentInstructions {
    return {
      immediateActions: [
        "Analyze project_knowledge for architectural patterns and constraints",
        "Review project_diagram for system structure and relationships",
        "Understand project standards and coding conventions",
        "Establish this context as foundation for all subsequent task work"
      ],
      nextRecommendedTools: ["get_task", "list_tasks"],
      workflowPhase: 'context',
      contextRequired: ["project_knowledge", "project_diagram", "project_standards"],
      criticalReminders: [
        "This context is essential for proper task interpretation",
        "Always reference project knowledge before starting any task",
        "Follow project standards and architectural patterns"
      ],
      automationHints: {
        contextEstablishment: "This tool provides the foundation for all project work",
        workflowGuidance: "Use get_task next to select specific task, or list_tasks to see all available tasks",
        knowledgeBase: "Project knowledge contains critical architectural decisions and patterns"
      }
    };
  }

  /**
   * Execute the get-project tool
   */
  async execute(input: GetProjectInput): Promise<unknown> {
    logger.info('Executing get-project tool', input);

    try {
      // Use the injected API client to get project by slug
      if (!this.apiClient) {
        throw new Error('API client not available - tool not properly initialized');
      }

      const url = `/project/slug/${input.slug.toUpperCase()}`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await this.apiClient.get<ProjectApiResponse>(url) as unknown as ProjectApiResponse;
      
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
