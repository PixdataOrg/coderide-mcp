#!/usr/bin/env node
/**
 * CodeRide MCP Server
 * 
 * Entry point for the MCP server that provides task management tools
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Import utilities
import { logger } from './utils/logger';
import { env } from './utils/env';

// Import tools
import { GetTaskTool } from './tools/get-task';
import { UpdateTaskTool } from './tools/update-task';
import { GetProjectTool } from './tools/get-project';
import { UpdateProjectTool } from './tools/update-project';
import { GetPromptTool } from './tools/get-prompt';
import { StartProjectTool } from './tools/start-project';
// New MCP tools
import { ProjectListTool } from './tools/project-list';
import { TaskListTool } from './tools/task-list';
import { NextTaskTool } from './tools/next-task';
// Deactivated tools (commented out)
// import { CreateTaskTool } from './tools/create-task';
// import { CreateProjectTool } from './tools/create-project';

/**
 * Main server class
 */
class CodeRideServer {
  private server: Server;
  private tools: any[] = [];

  constructor() {
    // Initialize MCP server
    this.server = new Server(
      {
        name: 'coderide',
        version: '0.3.3',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize tools
    this.initializeTools();

    // Set up error handler
    this.server.onerror = (error) => {
      logger.error('MCP Server error', error);
    };

    // Set up graceful shutdown
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
   * Initialize and register all tools
   */
  private initializeTools(): void {
    logger.info('Initializing tools');

    // Create tool instances
    this.tools = [
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
      // Deactivated tools
      // new CreateTaskTool(),
      // new CreateProjectTool(),
    ];

    // Register each tool with the server
    this.tools.forEach(tool => {
      tool.register(this.server);
    });

    // Register the list-tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools.map(tool => tool.getMCPToolDefinition()),
      };
    });

    // Register the call-tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const tool = this.tools.find(t => t.name === toolName);

      if (!tool) {
        throw new McpError(ErrorCode.MethodNotFound, `Tool '${toolName}' not found`);
      }

      try {
        // Validate input against schema
        const validatedInput = await tool.validateInput(request.params.arguments);
        
        // Execute the tool with validated input
        const result = await tool.execute(validatedInput);
        
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

    logger.info(`Registered ${this.tools.length} tools`);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
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

  // Removed zodSchemaToJsonSchema and zodTypeToJsonSchemaType methods
  // as they are no longer needed. Each tool now provides its full MCP definition.

  /**
   * Shutdown the server
   */
  private async shutdown(): Promise<void> {
    logger.info('Shutting down CodeRide MCP server');
    await this.server.close();
    logger.info('Server shutdown complete');
  }
}

// Create and start the server
const server = new CodeRideServer();
server.start().catch((error: Error) => {
  logger.error('Server start error', error);
  process.exit(1);
});
