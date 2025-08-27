/**
 * CodeRide MCP Server
 * 
 * Entry point for the MCP server that provides task management tools
 * Compatible with both STDIO and Smithery HTTP deployments
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Import utilities
import { logger } from './utils/logger.js';
import { tokenSecurityManager } from './utils/token-security.js';
import { BaseTool } from './utils/base-tool.js';
import { createApiConfig, ApiConfig, isProductionMode } from './utils/env.js';
import { createSecureApiClient } from './utils/secure-api-client.js';

// Import tools
import { GetTaskTool } from './tools/get-task.js';
import { UpdateTaskTool } from './tools/update-task.js';
import { GetProjectTool } from './tools/get-project.js';
import { UpdateProjectTool } from './tools/update-project.js';
import { GetPromptTool } from './tools/get-prompt.js';
import { StartProjectTool } from './tools/start-project.js';
// New MCP tools
import { ProjectListTool } from './tools/project-list.js';
import { TaskListTool } from './tools/task-list.js';
import { NextTaskTool } from './tools/next-task.js';

// Configuration schema for Smithery
export const configSchema = z.object({
  CODERIDE_API_KEY: z.string().describe("CodeRide API key for authentication")
});

/**
 * Create mock server for development/testing
 */
function createMockServer() {
  logger.info('Creating mock CodeRide MCP server for development');
  
  const server = new Server(
    {
      name: 'coderide-mock',
      version: '0.7.2',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Mock tools with professional descriptions matching production
  const mockTools = [
    {
      name: 'start_project',
      description: "Retrieves the project details and the prompt for the very first task of a specified project using the project's unique slug (e.g., 'CRD'). This is useful for initiating work on a new project or understanding its starting point.",
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', pattern: '^[A-Za-z]{3}$' }
        },
        required: ['slug']
      },
      handler: async (args: any) => ({
        project: { slug: args.slug, name: `CodeRide Project ${args.slug}` },
        task: { number: `${args.slug}-1`, title: 'Initialize Project Architecture', prompt: 'Set up the foundational architecture and development environment for this CodeRide project. Review project requirements and establish coding standards.' }
      })
    },
    {
      name: 'get_prompt',
      description: "Retrieves the specific instructions or prompt for a given task, identified by its unique task number (e.g., 'CRD-1'). This is typically used to understand the detailed requirements or context for an AI agent to work on the task.",
      inputSchema: {
        type: 'object',
        properties: {
          number: { type: 'string', pattern: '^[A-Za-z]{3}-\\d+$' }
        },
        required: ['number']
      },
      handler: async (args: any) => ({
        taskPrompt: `Implement the core functionality for task ${args.number}. Focus on clean, maintainable code following CodeRide best practices. Ensure proper error handling and comprehensive testing coverage.`
      })
    },
    {
      name: 'get_task',
      description: "Retrieves detailed information for a specific task using its unique task number (e.g., 'CRD-1').",
      inputSchema: {
        type: 'object',
        properties: {
          number: { type: 'string', pattern: '^[A-Za-z]{3}-\\d+$' }
        },
        required: ['number']
      },
      handler: async (args: any) => ({
        number: args.number,
        title: `Implement Feature Component`,
        description: 'Develop and integrate a new feature component following CodeRide architecture patterns and design system guidelines.',
        status: 'to-do',
        priority: 'high',
        agent: 'AI Development Assistant',
        agent_prompt: 'Focus on clean code architecture and comprehensive testing',
        context: 'Part of the core platform development initiative',
        instructions: 'Follow CodeRide coding standards and ensure proper documentation'
      })
    },
    {
      name: 'get_project',
      description: "Retrieves detailed information about a specific project using its unique 'slug' (three uppercase letters, e.g., 'CRD').",
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', pattern: '^[A-Za-z]{3}$' }
        },
        required: ['slug']
      },
      handler: async (args: any) => ({
        slug: args.slug,
        name: `CodeRide ${args.slug} Platform`,
        description: 'AI-native task management and development workflow platform designed for modern software teams.',
        projectKnowledge: { 
          components: ['task-engine', 'ai-integration', 'workflow-automation'], 
          technologies: ['TypeScript', 'React', 'Node.js', 'MCP'],
          architecture: 'microservices',
          patterns: ['dependency-injection', 'event-driven']
        },
        projectDiagram: 'graph TD\n  A[AI Agent] --> B[Task Engine]\n  B --> C[CodeRide API]\n  C --> D[Project Management]\n  D --> E[Workflow Automation]'
      })
    },
    {
      name: 'project_list',
      description: "Lists all projects in the user workspace. No input parameters required as the workspace is automatically determined from the API key authentication.",
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => ({
        projects: [
          { id: '1', slug: 'CRD', name: 'CodeRide Core Platform', description: 'Main CodeRide platform development' },
          { id: '2', slug: 'MCP', name: 'MCP Integration Suite', description: 'Model Context Protocol integration tools' },
          { id: '3', slug: 'API', name: 'CodeRide API Gateway', description: 'Unified API gateway and authentication system' }
        ],
        totalCount: 3
      })
    },
    {
      name: 'task_list',
      description: "Lists all tasks within a project using the project slug (e.g., 'CDB'). Returns tasks organized by status columns with their order and current status.",
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', pattern: '^[A-Za-z]{3}$' }
        },
        required: ['slug']
      },
      handler: async (args: any) => ({
        project: { slug: args.slug, name: `CodeRide ${args.slug} Platform` },
        taskSummary: { totalTasks: 4 },
        tasksByStatus: [
          {
            status: 'to-do',
            tasks: [
              { number: `${args.slug}-1`, title: 'Initialize Project Architecture', status: 'to-do' },
              { number: `${args.slug}-2`, title: 'Implement Core API Endpoints', status: 'to-do' }
            ]
          },
          {
            status: 'in-progress',
            tasks: [
              { number: `${args.slug}-3`, title: 'Develop User Authentication', status: 'in-progress' }
            ]
          },
          {
            status: 'completed',
            tasks: [
              { number: `${args.slug}-4`, title: 'Setup Development Environment', status: 'completed' }
            ]
          }
        ]
      })
    },
    {
      name: 'next_task',
      description: "Retrieves the next task in sequence based on the current task number (e.g., CDB-23 → CDB-24). This is useful for finding the next task that needs to be done in a project workflow.",
      inputSchema: {
        type: 'object',
        properties: {
          number: { type: 'string', pattern: '^[A-Za-z]{3}-\\d+$' }
        },
        required: ['number']
      },
      handler: async (args: any) => {
        const [slug, num] = args.number.split('-');
        const nextNum = parseInt(num) + 1;
        return {
          currentTask: { number: args.number },
          nextTask: { 
            number: `${slug}-${nextNum}`, 
            title: `Implement Advanced Features`, 
            status: 'to-do',
            description: 'Build advanced functionality and optimization features for the CodeRide platform.'
          }
        };
      }
    },
    {
      name: 'update_task',
      description: "Updates an existing task's 'description' and/or 'status'. The task is identified by its unique 'number' (e.g., 'CRD-1'). At least one of 'description' or 'status' must be provided for an update.",
      inputSchema: {
        type: 'object',
        properties: {
          number: { type: 'string', pattern: '^[A-Za-z]{3}-\\d+$' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['to-do', 'in-progress', 'completed'] }
        },
        required: ['number']
      },
      handler: async (args: any) => ({
        number: args.number,
        title: `CodeRide Task ${args.number}`,
        description: args.description || 'Updated task with enhanced functionality and improved implementation approach.',
        status: args.status || 'in-progress',
        updateConfirmation: `Successfully updated task ${args.number} in CodeRide platform`
      })
    },
    {
      name: 'update_project',
      description: "Updates a project's knowledge graph data and/or its structure diagram (in Mermaid.js format). The project is identified by its unique 'slug'. At least one of 'project_knowledge' or 'project_diagram' must be provided for an update to occur.",
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', pattern: '^[A-Za-z]{3}$' },
          project_knowledge: { type: 'object' },
          project_diagram: { type: 'string' }
        },
        required: ['slug']
      },
      handler: async (args: any) => ({
        slug: args.slug,
        name: `CodeRide ${args.slug} Platform`,
        project_knowledge: args.project_knowledge || { 
          updated: true, 
          components: ['enhanced-ai-engine', 'advanced-workflow'], 
          technologies: ['TypeScript', 'React', 'Node.js', 'MCP', 'AI/ML'] 
        },
        project_diagram: args.project_diagram || 'graph TD\n  A[Enhanced AI Engine] --> B[Smart Task Management]\n  B --> C[CodeRide Platform]\n  C --> D[Advanced Analytics]',
        updateConfirmation: `Successfully updated CodeRide project ${args.slug} with enhanced architecture`
      })
    }
  ];

  // Register list-tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: mockTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  }));

  // Register call-tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const mockTool = mockTools.find(t => t.name === toolName);

    if (!mockTool) {
      throw new McpError(ErrorCode.MethodNotFound, `Mock tool '${toolName}' not found`);
    }

    try {
      const result = await mockTool.handler(request.params.arguments || {});
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }]
      };
    } catch (error) {
      logger.error(`Error in mock tool ${toolName}`, error as Error);
      return {
        content: [{ type: 'text', text: JSON.stringify({ 
          success: false, 
          error: `Mock error: ${(error as Error).message}` 
        }) }],
        isError: true
      };
    }
  });

  return server;
}

/**
 * Create production server with real API integration
 */
function createProductionServer(smitheryConfig: z.infer<typeof configSchema>) {
  logger.info('Creating production CodeRide MCP server');
  
  // Create clean API configuration
  const apiConfig = createApiConfig(smitheryConfig);
  
  // Create secure API client with dependency injection
  const secureApiClient = createSecureApiClient(apiConfig);

  const server = new Server(
    {
      name: 'coderide',
      version: '0.7.2',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Initialize real tools with dependency injection
  const tools: any[] = [
    new StartProjectTool(secureApiClient),
    new GetPromptTool(secureApiClient),
    new GetTaskTool(secureApiClient),
    new GetProjectTool(secureApiClient),
    new UpdateTaskTool(secureApiClient),
    new UpdateProjectTool(secureApiClient),
    new ProjectListTool(secureApiClient),
    new TaskListTool(secureApiClient),
    new NextTaskTool(secureApiClient),
  ];

  // Register each tool with the server
  tools.forEach(tool => {
    tool.register(server);
  });

  // Register the list-tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map(tool => tool.getMCPToolDefinition()),
    };
  });

  // Register the call-tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const tool = tools.find(t => t.name === toolName);

    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Tool '${toolName}' not found`);
    }

    try {
      // Validate input against schema with security checks
      const validatedInput = await tool.validateInput(request.params.arguments);
      
      // Execute the tool with secure wrapper
      const result = await tool.secureExecute(validatedInput);
      
      // Return successful response with compact JSON formatting
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result), // Compact JSON format (no pretty-printing)
          },
        ],
      };
    } catch (error) {
      // Handle errors
      logger.error(`Error executing tool ${toolName}`, error as Error);
      
      // Determine if this is a validation error
      const isValidationError = error instanceof z.ZodError;
      
      // Return error response with compact JSON formatting
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: isValidationError
                ? `Validation error: ${(error as z.ZodError).message}`
                : (error as Error).message
            }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Create and configure the MCP server
 * This function is used by Smithery for HTTP deployments
 */
export default function createServer({ config }: { config?: z.infer<typeof configSchema> } = {}) {
  // Determine if we have a valid API key
  const hasValidApiKey = config?.CODERIDE_API_KEY && 
                        config.CODERIDE_API_KEY !== 'dev-key-placeholder' &&
                        config.CODERIDE_API_KEY.startsWith('CR_API_KEY_');

  // Create appropriate server based on configuration
  const server = hasValidApiKey ? createProductionServer(config!) : createMockServer();

  // Set up error handler
  server.onerror = (error) => {
    logger.error('MCP Server error', error);
  };

  const serverType = hasValidApiKey ? 'production' : 'mock';
  logger.info(`Created ${serverType} CodeRide MCP server`);
  
  return server;
}

/**
 * STDIO server class for local/CLI usage
 * This maintains backward compatibility for existing STDIO deployments
 */
class CodeRideServer {
  private server: Server;

  constructor() {
    // For STDIO mode, check if we have a real API key in environment
    const envApiKey = process.env.CODERIDE_API_KEY;
    const config = envApiKey ? { CODERIDE_API_KEY: envApiKey } : undefined;
    this.server = createServer({ config });

    // Set up graceful shutdown for STDIO mode
    process.on('SIGINT', async () => {
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.shutdown();
      process.exit(0);
    });
  }

  /**
   * Start the server with STDIO transport
   */
  public async start(): Promise<void> {
    try {
      logger.info('Starting CodeRide MCP server');
      
      // Create default API config for STDIO mode
      const apiConfig = createApiConfig();
      logger.info(`Using CodeRide API URL: ${apiConfig.CODERIDE_API_URL}`);

      // Create stdio transport
      const transport = new StdioServerTransport();
      
      // Connect server to transport
      await this.server.connect(transport);
      
      logger.info('CodeRide MCP server started and ready to receive requests');
    } catch (error) {
      logger.error('Failed to start server', error as Error);
      process.exit(1);
    }
  }

  /**
   * Shutdown the server
   */
  private async shutdown(): Promise<void> {
    logger.info('Shutting down CodeRide MCP server');
    
    // Shutdown token security manager
    tokenSecurityManager.shutdown();
    
    await this.server.close();
    logger.info('Server shutdown complete');
  }
}

// Only start STDIO server if this file is run directly (not imported by Smithery)
// Use Node.js compatible approach that works in both ES modules and CommonJS
const isMainModule = () => {
  try {
    // ES modules approach
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return import.meta.url === `file://${process.argv[1]}`;
    }
    
    // Fallback: check if this file is the main entry point
    return process.argv[1]?.endsWith('src/index.ts') || 
           process.argv[1]?.endsWith('dist/index.js') ||
           process.argv[1]?.endsWith('index.js');
  } catch {
    // If all else fails, assume we're in STDIO mode if no HTTP context
    return !process.env.SMITHERY_HTTP_MODE;
  }
};

if (isMainModule()) {
  const server = new CodeRideServer();
  server.start().catch((error: Error) => {
    logger.error('Server start error', error);
    process.exit(1);
  });
}
