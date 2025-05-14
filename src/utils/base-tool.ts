/**
 * Base tool class for MCP tools
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';
import { logger } from './logger';

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
   * Input schema for validation
   */
  abstract readonly schema: T;

  /**
   * Register this tool with the MCP server
   * Note: This doesn't actually register the tool handler,
   * it just logs that the tool is being registered.
   * The actual handler is registered in index.ts.
   */
  register(server: Server): void {
    logger.info(`Registering tool: ${this.name}`);
    // The actual registration happens in index.ts
  }

  /**
   * Validate input against schema
   */
  async validateInput(input: unknown): Promise<z.infer<T>> {
    try {
      return this.schema.parse(input);
    } catch (error) {
      logger.error(`Validation error in tool ${this.name}`, error as Error);
      throw error;
    }
  }

  /**
   * Execute the tool with validated input
   * Must be implemented by subclasses
   */
  abstract execute(input: z.infer<T>): Promise<unknown>;
}
