/**
 * Base tool class for MCP tools with security enhancements
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';
import { logger } from './logger.js';
import { validateNoTokenPassthrough, redactSensitiveTokens } from './token-security.js';
import { InputValidator, ValidationError, SecurityError } from './input-validator.js';
import { SecureApiClient } from './secure-api-client.js';

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
 * Tool metadata for enhanced discoverability and tool search alignment.
 * All fields are optional to maintain backwards compatibility.
 */
export interface MCPToolMetadata {
  /**
   * High-level functional area of the tool.
   * Primarily for organization and documentation.
   */
  category?: 'project' | 'task' | 'code-edit' | 'testing' | 'navigation' | 'repo' | 'ai-assist' | string;

  /**
   * Free-form tags to aid indexing and search.
   * Example: ["typescript", "jest", "refactor"].
   */
  tags?: string[];

  /**
   * Short guidance on when to use this tool.
   * Example: "Use when you need to generate unit tests for an existing file."
   */
  usage?: string;

  /**
   * Rough importance/visibility hint for UIs and docs.
   */
  priority?: 'primary' | 'advanced' | 'internal';
}

/**
 * Agent workflow phases for structured guidance
 */
export type WorkflowPhase = 'discovery' | 'context' | 'analysis' | 'implementation' | 'completion';

/**
 * Prerequisite validation configuration
 */
export interface PrerequisiteValidation {
  required: string[];
  onMissing: string;
}

/**
 * Status-aware guidance based on current state
 */
export interface StatusAwareGuidance {
  [status: string]: {
    actions: string[];
    nextTools: string[];
  };
}

/**
 * Agent-specific instructions for workflow automation
 */
export interface AgentInstructions {
  immediateActions: string[];
  nextRecommendedTools: string[];
  workflowPhase: WorkflowPhase;
  prerequisiteValidation?: PrerequisiteValidation;
  statusUpdateRequired?: boolean;
  projectUpdateRequired?: boolean;
  contextRequired?: string[];
  statusAwareGuidance?: StatusAwareGuidance;
  gitSetupRequired?: boolean;
  workflowCorrection?: {
    correctSequence: string[];
    redirectMessage: string;
  };
  criticalReminders?: string[];
  automationHints?: {
    [key: string]: any;
  };
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
  metadata?: MCPToolMetadata;
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
   * Optional metadata for enhanced discoverability and tool search alignment.
   * Subclasses can override this to provide categorization, tags, and usage guidance.
   */
  readonly metadata?: MCPToolMetadata;

  /**
   * Optional API client for tools that need API access
   * Injected via constructor for clean dependency management
   */
  protected apiClient?: SecureApiClient;

  /**
   * Constructor for dependency injection
   */
  constructor(apiClient?: SecureApiClient) {
    this.apiClient = apiClient;
  }
  
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
   * Validate input against the Zod schema with security enhancements.
   */
  async validateInput(input: unknown): Promise<z.infer<T>> {
    const requestId = InputValidator.generateRequestId();
    
    try {
      // Log tool execution start
      logger.debug(`Tool ${this.name} validation started [${requestId}]`);
      
      // CRITICAL: Check for token passthrough (MCP Security Requirement)
      validateNoTokenPassthrough(input, `tool ${this.name} input`);
      
      // Validate with Zod schema
      const validatedInput = this.zodSchema.parse(input);
      
      // Additional security validation for common fields
      if (validatedInput && typeof validatedInput === 'object') {
        this.performSecurityValidation(validatedInput, requestId);
      }
      
      logger.debug(`Tool ${this.name} validation successful [${requestId}]`);
      return validatedInput;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError(`Validation error in tool ${this.name}: ${error.message}`);
        logger.error(`Validation failed for tool ${this.name} [${requestId}]: ${error.message}`);
        throw validationError;
      } else if (error instanceof ValidationError || error instanceof SecurityError) {
        logger.error(`Security validation failed for tool ${this.name} [${requestId}]: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      } else {
        logger.error(`Unexpected error in tool ${this.name} [${requestId}]: ${(error as Error).message}`);
        throw new ValidationError(`Validation failed for tool ${this.name}`);
      }
    }
  }

  /**
   * Perform additional security validation on common input fields
   * Enhanced with Priority 4 security features
   */
  private performSecurityValidation(input: any, requestId: string): void {
    // Priority 4: Validate user permissions and detect suspicious content
    try {
      InputValidator.validateUserPermissions(input, `tool ${this.name} input`);
    } catch (error) {
      throw new SecurityError(`Security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Priority 4: Rate limiting for update operations (only for update tools)
    if (this.name.includes('update')) {
      const identifier = input.slug || input.number || 'unknown';
      try {
        InputValidator.validateRateLimit(this.name, identifier);
      } catch (error) {
        throw new SecurityError(`Rate limit validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Validate project slugs
    if (input.slug && typeof input.slug === 'string') {
      try {
        input.slug = InputValidator.validateProjectSlug(input.slug);
      } catch (error) {
        throw new ValidationError(`Invalid project slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Validate task numbers
    if (input.number && typeof input.number === 'string') {
      try {
        input.number = InputValidator.validateTaskNumber(input.number);
      } catch (error) {
        throw new ValidationError(`Invalid task number: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Validate task status
    if (input.status && typeof input.status === 'string') {
      try {
        input.status = InputValidator.validateTaskStatus(input.status);
      } catch (error) {
        throw new ValidationError(`Invalid task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Validate and sanitize descriptions
    if (input.description !== undefined) {
      try {
        input.description = InputValidator.sanitizeDescription(input.description);
      } catch (error) {
        throw new ValidationError(`Invalid description: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Validate JSON inputs (project_knowledge, project_diagram)
    if (input.project_knowledge !== undefined) {
      try {
        input.project_knowledge = InputValidator.validateJsonInput(input.project_knowledge);
      } catch (error) {
        throw new ValidationError(`Invalid project knowledge: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (input.project_diagram && typeof input.project_diagram === 'string') {
      try {
        input.project_diagram = InputValidator.sanitizeDescription(input.project_diagram);
      } catch (error) {
        throw new ValidationError(`Invalid project diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Execute the tool with validated input and security logging.
   * Must be implemented by subclasses.
   */
  abstract execute(input: z.infer<T>): Promise<unknown>;

  /**
   * Generate agent instructions for this tool.
   * Subclasses can override this to provide tool-specific guidance.
   */
  protected generateAgentInstructions(input: z.infer<T>, result: any): AgentInstructions {
    // Default implementation - subclasses should override for specific guidance
    return {
      immediateActions: [`Tool ${this.name} executed successfully`],
      nextRecommendedTools: [],
      workflowPhase: 'implementation'
    };
  }

  /**
   * Generate contextual agent instructions based on tool result and current state.
   * This method provides dynamic guidance based on the tool's output.
   */
  protected generateContextualGuidance(input: z.infer<T>, result: any): Partial<AgentInstructions> {
    const guidance: Partial<AgentInstructions> = {};

    // Add status-aware guidance for tools that work with task status
    if (result && typeof result === 'object' && 'status' in result) {
      guidance.statusAwareGuidance = this.getStatusAwareGuidance(result.status);
    }

    // Add prerequisite validation for tools that require context
    if (this.requiresProjectContext()) {
      guidance.prerequisiteValidation = {
        required: ['get_project'],
        onMissing: 'Project context required - call get_project first'
      };
    }

    return guidance;
  }

  /**
   * Check if this tool requires project context.
   * Override in subclasses that need project context.
   */
  protected requiresProjectContext(): boolean {
    return false;
  }

  /**
   * Get status-aware guidance based on task status.
   */
  protected getStatusAwareGuidance(status: string): StatusAwareGuidance {
    const guidance: StatusAwareGuidance = {};

    switch (status) {
      case 'to-do':
        guidance[status] = {
          actions: [
            'Review task requirements and project context',
            'Update status to "in-progress" when ready to start'
          ],
          nextTools: ['get_prompt', 'update_task']
        };
        break;
      case 'in-progress':
        guidance[status] = {
          actions: [
            'Continue task implementation',
            'Update progress as needed'
          ],
          nextTools: ['update_task']
        };
        break;
      case 'completed':
        guidance[status] = {
          actions: [
            'Update project knowledge with implementation impacts',
            'Update project diagram if architecture changed',
            'Find next task in sequence'
          ],
          nextTools: ['update_project', 'next_task']
        };
        break;
    }

    return guidance;
  }

  /**
   * Enhanced secure execute wrapper with agent instruction integration
   */
  async secureExecute(input: z.infer<T>): Promise<unknown> {
    const requestId = InputValidator.generateRequestId();
    
    try {
      logger.info(`Tool ${this.name} execution started [${requestId}]`);
      
      const result = await this.execute(input);
      
      // CRITICAL: Redact any sensitive tokens from output (MCP Security Requirement)
      const tokenRedactedResult = redactSensitiveTokens(result);
      
      // Sanitize output to remove other sensitive information
      const sanitizedResult = InputValidator.sanitizeOutput(tokenRedactedResult);
      
      // Generate agent instructions for workflow guidance
      const agentInstructions = this.generateAgentInstructions(input, sanitizedResult);
      const contextualGuidance = this.generateContextualGuidance(input, sanitizedResult);
      
      // Merge instructions with contextual guidance
      const enhancedInstructions: AgentInstructions = {
        ...agentInstructions,
        ...contextualGuidance,
        // Merge arrays properly
        immediateActions: [
          ...agentInstructions.immediateActions,
          ...(contextualGuidance.immediateActions || [])
        ],
        nextRecommendedTools: [
          ...agentInstructions.nextRecommendedTools,
          ...(contextualGuidance.nextRecommendedTools || [])
        ]
      };

      // Create enhanced result with agent instructions
      const enhancedResult = {
        ...sanitizedResult,
        _agentInstructions: enhancedInstructions
      };
      
      logger.info(`Tool ${this.name} execution completed successfully [${requestId}]`);
      return enhancedResult;
    } catch (error) {
      logger.error(`Tool ${this.name} execution failed [${requestId}]: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Re-throw with context but don't expose internal details
      if (error instanceof ValidationError || error instanceof SecurityError) {
        throw error;
      } else {
        throw new Error(`Tool execution failed: ${this.name}`);
      }
    }
  }
}
