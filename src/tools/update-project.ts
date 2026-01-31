/**
 * Update Project Tool
 * 
 * Updates project knowledge and diagram using the CodeRide API
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations, AgentInstructions } from '../utils/base-tool.js';
import { SecureApiClient, UpdateProjectApiResponse } from '../utils/secure-api-client.js';
import { logger } from '../utils/logger.js';

// Removed local UpdateProjectResponse as UpdateProjectApiResponse from api-client.ts will be used.

/**
 * Flexible schema for project knowledge data
 * Supports both simple strings and structured objects for maximum usability
 */
const ProjectKnowledgeSchema = z.object({
  // Core project information - flexible to support both strings and objects
  components: z.array(
    z.union([
      z.string().max(500, "Component description too long"),
      z.object({
        name: z.string().max(100, "Component name too long"),
        type: z.string().max(50, "Component type too long").optional(),
        status: z.string().max(50, "Component status too long").optional(),
        description: z.string().max(500, "Component description too long").optional(),
      }).passthrough() // Allow additional properties
    ])
  ).max(50, "Too many components").optional(),
  
  dependencies: z.array(
    z.union([
      z.string().max(500, "Dependency description too long"),
      z.object({
        name: z.string().max(100, "Dependency name too long"),
        version: z.string().max(50, "Dependency version too long").optional(),
        purpose: z.string().max(500, "Dependency purpose too long").optional(),
      }).passthrough()
    ])
  ).max(50, "Too many dependencies").optional(),
  
  technologies: z.array(
    z.union([
      z.string().max(500, "Technology description too long"), // Increased from 50 to 500
      z.object({
        name: z.string().max(100, "Technology name too long"),
        type: z.string().max(50, "Technology type too long").optional(),
        purpose: z.string().max(500, "Technology purpose too long").optional(),
        version: z.string().max(50, "Technology version too long").optional(),
      }).passthrough()
    ])
  ).max(30, "Too many technologies").optional(), // Increased from 20 to 30
  
  // Architecture and design
  architecture: z.string().max(3000, "Architecture description too long").optional(), // Increased from 2000
  patterns: z.array(
    z.union([
      z.string().max(200, "Pattern description too long"), // Increased from 100
      z.object({
        name: z.string().max(100, "Pattern name too long"),
        description: z.string().max(500, "Pattern description too long").optional(),
      }).passthrough()
    ])
  ).max(30, "Too many patterns").optional(), // Increased from 20
  
  // Documentation and notes
  notes: z.string().max(10000, "Notes too long").optional(), // Increased from 5000
  links: z.array(z.string().url("Invalid URL format").max(500, "URL too long")).max(20, "Too many links").optional(), // Increased from 10
  
  // Custom metadata (controlled) - more flexible
  metadata: z.record(
    z.union([
      z.string().max(1000, "Metadata value too long"), // Increased from 500
      z.object({}).passthrough() // Allow objects in metadata
    ])
  ).optional(),
}).passthrough(); // Allow additional properties for maximum flexibility

/**
 * Schema for the update-project tool input
 */
const UpdateProjectSchema = z.object({
  // Required field to identify the project
  slug: z.string({
    required_error: "Project slug is required to identify the project",
    invalid_type_error: "Project slug must be a string"
  })
  .regex(/^[A-Za-z]{3}$/, { message: "Project slug must be three letters (e.g., CRD or crd). Case insensitive." })
  .describe("Project slug to identify the project to update (case insensitive)"),
  
  // Optional fields that can be updated with security constraints
  project_knowledge: ProjectKnowledgeSchema.optional().describe("Project knowledge graph data (structured JSON object with size limits)"),
  project_diagram: z.string()
    .max(15000, "Project diagram cannot exceed 15000 characters")
    .optional()
    .describe("Project structure diagram (Mermaid.js format)"),
}).strict().refine(
  // Ensure at least one field to update is provided
  (data) => {
    const updateFields = ['project_knowledge', 'project_diagram'];
    return updateFields.some(field => field in data);
  },
  {
    message: 'At least one field to update must be provided',
    path: ['updateFields']
  }
);

/**
 * Type for the update-project tool input
 */
type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

/**
 * Update Project Tool Implementation
 */
export class UpdateProjectTool extends BaseTool<typeof UpdateProjectSchema> {
  readonly name = 'update_project';
  readonly description = "Updates a project's knowledge graph data and/or its structure diagram (in Mermaid.js format). The project is identified by its unique 'slug'. At least one of 'project_knowledge' or 'project_diagram' must be provided for an update to occur. Use this when you've completed tasks that affect the codebase architecture, discovered new patterns, or need to document implementation impacts in the project's knowledge base.";
  readonly zodSchema = UpdateProjectSchema; // Renamed from schema
  readonly annotations: ToolAnnotations = {
    title: "Update Project",
    readOnlyHint: false, // This tool modifies data
    destructiveHint: false, // Assuming updates are not inherently destructive but additive or modifying
    idempotentHint: false, // Multiple identical updates might have different outcomes if not designed for idempotency
    openWorldHint: true, // Interacts with an external API
  };
  readonly metadata = {
    category: 'project' as const,
    tags: ['project', 'update', 'knowledge', 'diagram', 'mermaid', 'write'],
    usage: 'Use when you have completed tasks that affect the codebase architecture, discovered new patterns, or need to document implementation impacts in the project knowledge base',
    priority: 'primary' as const
  };

  /**
   * Constructor with dependency injection
   */
  constructor(apiClient?: SecureApiClient) {
    super(apiClient);
  }

  /**
   * Generate agent-specific instructions for project update workflow
   */
  generateAgentInstructions(input: any): AgentInstructions {
    const isKnowledgeUpdate = input.project_knowledge !== undefined;
    const isDiagramUpdate = input.project_diagram !== undefined;
    
    const baseInstructions: AgentInstructions = {
      immediateActions: [
        'Project update completed successfully',
        'Knowledge base synchronized with current implementation'
      ],
      nextRecommendedTools: ['next_task'],
      workflowPhase: 'completion',
      criticalReminders: [
        'Project knowledge and diagram should be updated after significant changes',
        'Keep documentation current to maintain project coherence'
      ]
    };

    // Specific guidance based on update type
    if (isKnowledgeUpdate && isDiagramUpdate) {
      baseInstructions.immediateActions = [
        'Project knowledge and diagram updated',
        'Complete project documentation synchronized',
        'Ready for next task in sequence'
      ];
      baseInstructions.criticalReminders = [
        'Both knowledge and architecture documentation updated - excellent practice',
        'Project context is now current for future tasks'
      ];
    } else if (isKnowledgeUpdate) {
      baseInstructions.immediateActions = [
        'Project knowledge updated with implementation details',
        'Consider updating project diagram if architecture changed'
      ];
      baseInstructions.criticalReminders = [
        'Knowledge updated - verify if diagram also needs updates',
        'Architectural changes should be reflected in both knowledge and diagram'
      ];
    } else if (isDiagramUpdate) {
      baseInstructions.immediateActions = [
        'Project diagram updated with architectural changes',
        'Consider updating project knowledge with implementation details'
      ];
      baseInstructions.criticalReminders = [
        'Diagram updated - verify if knowledge also needs updates',
        'Implementation details should be captured in project knowledge'
      ];
    }

    // Add automation hints for knowledge maintenance
    baseInstructions.automationHints = {
      knowledgeUpdateTriggers: [
        'After completing tasks that add new components',
        'After implementing new technologies or patterns',
        'After making architectural decisions'
      ],
      diagramUpdateTriggers: [
        'After adding new system components',
        'After changing component relationships',
        'After modifying data flow or architecture'
      ],
      maintenanceFrequency: 'After each significant task completion'
    };

    return baseInstructions;
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
            description: "The unique three-letter project identifier/code (e.g., 'CRD' for CodeRide). This is the same prefix used in task numbers. Case insensitive - will be converted to uppercase internally."
          },
          project_knowledge: {
            type: "object",
            description: "Optional. A structured JSON object representing the project's knowledge graph containing components, dependencies, technologies, architecture patterns, and notes. Structure: { components: [], dependencies: [], technologies: [], architecture: string, patterns: [], notes: string, links: [], metadata: {} }. Limits: max 50 components, 30 technologies, 30 patterns, 10000 chars for notes. Use this to document architectural decisions, implementation impacts, and project learnings after completing tasks."
          },
          project_diagram: {
            type: "string",
            description: "Optional. A Mermaid.js format diagram representing the project's architecture, component relationships, and data flow (e.g., 'graph TD; A-->B; B-->C'). Maximum 15000 characters. Use this to visualize system structure, component dependencies, or architectural changes made during task implementation. Update this whenever you add new components or modify relationships."
          }
        },
        required: ["slug"], // Zod .refine() handles the "at least one update field" logic at runtime.
        additionalProperties: false
      }
    };
  }

  /**
   * Execute the update-project tool
   */
  async execute(input: UpdateProjectInput): Promise<unknown> {
    logger.info('Executing update-project tool', input);

    try {
      // Use the injected API client to update project
      if (!this.apiClient) {
        throw new Error('API client not available - tool not properly initialized');
      }

      // Extract project slug
      const { slug, ...updateData } = input;
      
      // Update project using the API endpoint
      const url = `/project/slug/${slug.toUpperCase()}`;
      logger.debug(`Making PUT request to: ${url}`);
      
      const responseData = await this.apiClient.put<UpdateProjectApiResponse>(url, updateData) as unknown as UpdateProjectApiResponse;

      if (!responseData.success) {
        const apiErrorMessage = responseData.message || 'API reported update failure without a specific message.';
        logger.warn(`Update project API call for ${slug} returned success:false. Message: ${apiErrorMessage}`);
        return {
          isError: true,
          content: [{ type: "text", text: `Update for project ${slug} failed: ${apiErrorMessage}` }]
        };
      }

      // At this point, responseData.success is true
      const updatedFieldsList = Object.keys(updateData).join(', ') || 'no specific fields (refresh)';
      const apiMessage = responseData.message || 'Project successfully updated.';

      if (responseData.project) {
        const diagramFromResponse = responseData.project.project_diagram; // snake_case access

        return {
          slug: responseData.project.slug,
          name: responseData.project.name, 
          description: responseData.project.description, 
          project_knowledge: responseData.project.project_knowledge || {}, // snake_case access and output
          project_diagram: diagramFromResponse || '', // Use the new variable (already snake_case)
          updateConfirmation: `Project ${responseData.project.slug} updated fields: ${updatedFieldsList}. API: ${apiMessage}`
        };
      } else {
        // responseData.success is true, but responseData.project is missing.
        logger.warn(`Update project API call for ${slug} succeeded but returned no project data. API message: ${apiMessage}`);
        return {
          slug: slug, 
          name: '', 
          description: '', 
          project_knowledge: input.project_knowledge || {}, // Input is snake_case from Zod schema
          project_diagram: input.project_diagram || '',   // Input is snake_case from Zod schema
          updateConfirmation: `Project ${slug} update reported success by API, but full project details were not returned. Attempted to update fields: ${updatedFieldsList}. API: ${apiMessage}`
        };
      }
    } catch (error) {
      let errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      logger.error(`Error in update-project tool: ${errorMessage}`, error instanceof Error ? error : undefined);

      if (error instanceof Error && (error as any).status === 404) {
         errorMessage = `Project with slug '${input.slug}' not found.`;
      } else if (error instanceof Error && error.message.includes('not found')) { // Fallback for other not found indications
         errorMessage = `Project with slug '${input.slug}' not found or update failed.`;
      }
      
      return {
        isError: true,
        content: [{ type: "text", text: errorMessage }]
      };
    }
  }
}
