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
        version: '0.1.0',
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
      new GetTaskTool(),
      new UpdateTaskTool(),
      new GetProjectTool(),
      new UpdateProjectTool(),
      new GetPromptTool(),
      new StartProjectTool(),
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
        tools: this.tools.map(tool => {
          // Check if tool has a custom getInputSchema method
          if (typeof tool.getInputSchema === 'function') {
            return {
              name: tool.name,
              description: tool.description,
              inputSchema: tool.getInputSchema()
            };
          }
          
          // Fall back to default schema conversion
          return {
            name: tool.name,
            description: tool.description,
            inputSchema: {
              type: "object",
              properties: this.zodSchemaToJsonSchema(tool.schema),
              required: []
            }
          };
        }),
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

  /**
   * Convert a Zod schema to a JSON schema
   */
  private zodSchemaToJsonSchema(schema: z.ZodType): Record<string, any> {
    try {
      // For simplicity, we'll just extract the shape if it's an object
      if (schema instanceof z.ZodObject) {
        const shape = schema._def.shape();
        const properties: Record<string, any> = {};
        
        // Convert each property
        for (const [key, value] of Object.entries(shape)) {
          properties[key] = this.zodTypeToJsonSchemaType(value as z.ZodType);
        }
        
        return properties;
      }
      
      // Default empty object
      return {};
    } catch (error) {
      logger.error('Failed to convert Zod schema to JSON schema', error as Error);
      return {};
    }
  }
  
  /**
   * Convert a Zod type to a JSON schema type
   */
  private zodTypeToJsonSchemaType(zodType: z.ZodType): Record<string, any> {
    if (zodType instanceof z.ZodString) {
      return { type: 'string' };
    } else if (zodType instanceof z.ZodNumber) {
      return { type: 'number' };
    } else if (zodType instanceof z.ZodBoolean) {
      return { type: 'boolean' };
    } else if (zodType instanceof z.ZodArray) {
      return { 
        type: 'array',
        items: this.zodTypeToJsonSchemaType(zodType._def.type)
      };
    } else if (zodType instanceof z.ZodObject) {
      return {
        type: 'object',
        properties: this.zodSchemaToJsonSchema(zodType)
      };
    } else if (zodType instanceof z.ZodOptional) {
      return this.zodTypeToJsonSchemaType(zodType._def.innerType);
    } else {
      // Default to any type
      return { type: 'string' };
    }
  }

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
