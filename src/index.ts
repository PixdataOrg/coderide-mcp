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
  CODERIDE_API_KEY: z.string().describe("CodeRide API key for authentication (format: CR_API_KEY_xxxxxxxxxxxxxxxxxxxx)")
});

/**
 * Create and configure the MCP server
 * This function is used by Smithery for HTTP deployments
 */
export default function createServer({ config }: { config?: z.infer<typeof configSchema> } = {}) {
  // Set environment variables from config if provided (Smithery deployment)
  if (config?.CODERIDE_API_KEY) {
    process.env.CODERIDE_API_KEY = config.CODERIDE_API_KEY;
    process.env.CODERIDE_API_URL = process.env.CODERIDE_API_URL || 'https://api.coderide.ai';
  }

  // Initialize MCP server
  const server = new Server(
    {
      name: 'coderide',
      version: '0.6.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Initialize tools
  const tools: any[] = [
    new StartProjectTool(),
    new GetPromptTool(),
    new GetTaskTool(),
    new GetProjectTool(),
    new UpdateTaskTool(),
    new UpdateProjectTool(),
    // New MCP tools
    new ProjectListTool(),
    new TaskListTool(),
    new NextTaskTool(),
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

  // Set up error handler
  server.onerror = (error) => {
    logger.error('MCP Server error', error);
  };

  logger.info(`Registered ${tools.length} tools`);
  
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
      // Import env here to avoid issues in Smithery deployment
      const { env } = await import('./utils/env.js');
      
      logger.info('Starting CodeRide MCP server');
      logger.info(`Using CodeRide API URL: ${env.CODERIDE_API_URL}`);

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
