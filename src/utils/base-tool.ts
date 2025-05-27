/**
 * Base tool class for MCP tools
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';
import { logger } from './logger';

/**
 * Abstract base class for all MCP tools
 */
/**
 * Defines the structure for MCP tool annotations.
 */
export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

/**
 * Defines the structure for the full MCP tool definition as expected by the MCP server.
 * The inputSchema here must be a JSON Schema object.
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>; // JSON Schema representation
  annotations?: ToolAnnotations;
}

/**
 * Abstract base class for all MCP tools
 */
export abstract class BaseTool<T extends z.ZodType> {
  /**
   * Tool name (must be unique)
   */
  abstract readonly name: string;

  /**
   * Tool description
   */
  abstract readonly description: string;

  /**
   * Zod input schema for runtime validation.
   */
  abstract readonly zodSchema: T;

  /**
   * Tool annotations providing hints about its behavior.
   */
  abstract readonly annotations: ToolAnnotations;
  
  /**
   * Register this tool with the MCP server.
   * This method is a placeholder for conceptual registration logging.
   * Actual registration with the MCP SDK happens in index.ts using getMCPToolDefinition().
   */
  register(server: Server): void {
    logger.info(`Registering tool: ${this.name} with definition from getMCPToolDefinition()`);
    // The actual registration (e.g., server.tool(...)) happens in index.ts
    // using the output of this.getMCPToolDefinition()
  }

  /**
   * Returns the full tool definition conforming to MCP, including a JSON schema for inputs.
   * Subclasses must implement this to provide their complete definition.
   */
  abstract getMCPToolDefinition(): MCPToolDefinition;

  /**
   * Validate input against the Zod schema.
   */
  async validateInput(input: unknown): Promise<z.infer<T>> {
    try {
      return this.zodSchema.parse(input);
    } catch (error) {
      logger.error(`Validation error in tool ${this.name}: ${(error as Error).message}`, error instanceof Error ? error : undefined);
      throw error; // Re-throw to be handled by the caller or MCP framework
    }
  }

  /**
   * Execute the tool with validated input.
   * Must be implemented by subclasses.
   */
  abstract execute(input: z.infer<T>): Promise<unknown>;
}
