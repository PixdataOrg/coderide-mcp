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
      version: '0.7.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Mock tools that return sample data
  const mockTools = [
    {
      name: 'start_project',
      description: 'Get project details and first task (Mock)',
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', pattern: '^[A-Za-z]{3}$' }
        },
        required: ['slug']
      },
      handler: async (args: any) => ({
        project: { slug: args.slug, name: `Mock Project ${args.slug}` },
        task: { number: `${args.slug}-1`, title: 'Mock First Task', prompt: 'This is a mock task prompt for development.' }
      })
    },
    {
      name: 'get_prompt',
      description: 'Get task prompt (Mock)',
      inputSchema: {
        type: 'object',
        properties: {
          number: { type: 'string', pattern: '^[A-Za-z]{3}-\\d+$' }
        },
        required: ['number']
      },
      handler: async (args: any) => ({
        taskPrompt: `Mock prompt for task ${args.number}. This is development data.`
      })
    },
    {
      name: 'get_task',
      description: 'Get task details (Mock)',
      inputSchema: {
        type: 'object',
        properties: {
          number: { type: 'string', pattern: '^[A-Za-z]{3}-\\d+$' }
        },
        required: ['number']
      },
      handler: async (args: any) => ({
        number: args.number,
        title: `Mock Task ${args.number}`,
        description: 'This is mock task data for development',
        status: 'to-do',
        priority: 'medium'
      })
    },
    {
      name: 'get_project',
      description: 'Get project details (Mock)',
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', pattern: '^[A-Za-z]{3}$' }
        },
        required: ['slug']
      },
      handler: async (args: any) => ({
        slug: args.slug,
        name: `Mock Project ${args.slug}`,
        description: 'This is mock project data for development',
        projectKnowledge: { components: ['mock-component'], technologies: ['mock-tech'] },
        projectDiagram: 'graph TD\n  A[Mock Component] --> B[Mock Output]'
      })
    },
    {
      name: 'project_list',
      description: 'List all projects (Mock)',
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => ({
        projects: [
          { id: '1', slug: 'ABC', name: 'Mock Project ABC', description: 'Development project' },
          { id: '2', slug: 'XYZ', name: 'Mock Project XYZ', description: 'Another development project' }
        ],
        totalCount: 2
      })
    },
    {
      name: 'task_list',
      description: 'List tasks in project (Mock)',
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', pattern: '^[A-Za-z]{3}$' }
        },
        required: ['slug']
      },
      handler: async (args: any) => ({
        project: { slug: args.slug, name: `Mock Project ${args.slug}` },
        taskSummary: { totalTasks: 2 },
        tasksByStatus: [{
          status: 'to-do',
          tasks: [
            { number: `${args.slug}-1`, title: 'Mock Task 1', status: 'to-do' },
            { number: `${args.slug}-2`, title: 'Mock Task 2', status: 'to-do' }
          ]
        }]
      })
    },
    {
      name: 'next_task',
      description: 'Get next task (Mock)',
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
          nextTask: { number: `${slug}-${nextNum}`, title: `Mock Next Task ${nextNum}`, status: 'to-do' }
        };
      }
    },
    {
      name: 'update_task',
      description: 'Update task (Mock)',
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
        title: `Mock Task ${args.number}`,
        description: args.description || 'Updated mock description',
        status: args.status || 'in-progress',
        updateConfirmation: `Mock update successful for ${args.number}`
      })
    },
    {
      name: 'update_project',
      description: 'Update project (Mock)',
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
        name: `Mock Project ${args.slug}`,
        project_knowledge: args.project_knowledge || { updated: true },
        project_diagram: args.project_diagram || 'Updated mock diagram',
        updateConfirmation: `Mock update successful for project ${args.slug}`
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
      version: '0.7.0',
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
    this.server = createServer();

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
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('src/index.ts')) {
  const server = new CodeRideServer();
  server.start().catch((error: Error) => {
    logger.error('Server start error', error);
    process.exit(1);
  });
}
