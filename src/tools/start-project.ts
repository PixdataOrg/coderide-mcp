/**
 * Start Project Tool
 * 
 * Retrieves task prompt from the first task of a project
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations, AgentInstructions } from '../utils/base-tool.js';
import { SecureApiClient, StartProjectApiResponse } from '../utils/secure-api-client.js';
import { logger } from '../utils/logger.js';

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
  readonly description = "Retrieves the project details and the prompt for the very first task of a specified project using the project's unique slug (e.g., 'CRD'). Use this when beginning work on a new project to get both the project context and the initial task in a single call, streamlining the workflow startup.";
  readonly zodSchema = StartProjectSchema; // Renamed from schema
  readonly annotations: ToolAnnotations = {
    title: "Start Project",
    readOnlyHint: true,
    openWorldHint: true, // Interacts with an external API
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
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            pattern: "^[A-Za-z]{3}$",
            description: "The unique three-letter project identifier/code (e.g., 'CRD' for CodeRide). This will retrieve both the project details and the first task's prompt in a single call, streamlining project initialization. Case insensitive - will be converted to uppercase internally."
          }
        },
        required: ["slug"],
        additionalProperties: false
      }
    };
  }

  /**
   * Generate agent instructions for start_project tool
   */
  protected generateAgentInstructions(input: StartProjectInput, result: any): AgentInstructions {
    return {
      immediateActions: [
        "Check if git repository exists for this project",
        "Initialize git repository if not present (git init, initial commit)",
        "Proceed to get_project for comprehensive project context",
        "Review the first task prompt for project initialization requirements"
      ],
      nextRecommendedTools: ["get_project"],
      workflowPhase: 'context',
      gitSetupRequired: true,
      criticalReminders: [
        "This is project initialization - establish git repository first",
        "Always get full project context before starting first task",
        "Follow the structured workflow: get_project → get_task → get_prompt"
      ],
      automationHints: {
        projectInitialization: "This tool starts a new project workflow",
        gitSetup: "Ensure version control is established before proceeding",
        workflowGuidance: "Use get_project next to understand project architecture and standards"
      }
    };
  }

  /**
   * Execute the start-project tool
   */
  async execute(input: StartProjectInput): Promise<unknown> {
    logger.info('Executing start-project tool', input);

    try {
      // Use the injected API client to get first task
      if (!this.apiClient) {
        throw new Error('API client not available - tool not properly initialized');
      }

      // Get the first task of the project using the new endpoint
      const url = `/project/slug/${input.slug.toUpperCase()}/first-task`;
      logger.debug(`Making GET request to: ${url}`);
      
      const responseData = await this.apiClient.get<StartProjectApiResponse>(url) as unknown as StartProjectApiResponse;
      // const responseData: StartProjectApiResponse = axiosResponse.data; // This was the previous incorrect line
      
      if (!responseData || responseData.error) { 
        const errorMessage = responseData?.error || `Failed to get first task for project '${input.slug}' (no data or error in response).`;
        logger.warn(`Error in start-project tool: ${errorMessage}`, { responseData });
        return {
          isError: true,
          content: [{ type: "text", text: errorMessage }]
        };
      }
      
      // Git integration: Set up repository if needed
      const gitSetupResult = await this.setupGitRepository(responseData.project);
      
      // Return data structured according to the new schema with git setup status
      return {
        project: {
          slug: responseData.project?.slug || '',
          name: responseData.project?.name || ''
        },
        task: {
          number: responseData.task?.number || '',
          title: responseData.task?.title || '',
          prompt: responseData.task?.prompt || '' // Access 'prompt' and output as 'prompt'
        },
        gitSetup: gitSetupResult
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

  /**
   * Set up git repository for the project
   */
  private async setupGitRepository(projectData: any): Promise<{ status: string; message: string; actions: string[] }> {
    try {
      const projectSlug = projectData?.slug;
      const projectName = projectData?.name || projectSlug;
      
      // Check if we're in a git repository
      const { execSync } = await import('child_process');
      
      try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        // Already in a git repository
        return {
          status: 'existing',
          message: 'Git repository already exists',
          actions: [
            'Verified existing git repository',
            'Ready for project development',
            'Consider creating feature branch for project work'
          ]
        };
      } catch {
        // Not in a git repository, initialize one
        try {
          execSync('git init', { stdio: 'ignore' });
          execSync('git add .', { stdio: 'ignore' });
          execSync(`git commit -m "feat: initialize ${projectName} project (${projectSlug})"`, { stdio: 'ignore' });
          
          return {
            status: 'initialized',
            message: 'Git repository initialized successfully',
            actions: [
              'Initialized new git repository',
              'Created initial commit for project',
              'Ready for feature branch creation',
              'Consider setting up remote repository'
            ]
          };
        } catch (gitError) {
          return {
            status: 'failed',
            message: `Git initialization failed: ${gitError}`,
            actions: [
              'Manual git setup required',
              'Run: git init',
              'Run: git add .',
              'Run: git commit -m "feat: initialize project"'
            ]
          };
        }
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Git setup error: ${error}`,
        actions: [
          'Git not available or accessible',
          'Install git if needed',
          'Verify git is in PATH'
        ]
      };
    }
  }
}
