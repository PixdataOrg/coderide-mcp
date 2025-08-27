/**
 * Update Project Tool
 * 
 * Updates project knowledge and diagram using the CodeRide API
 */
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations } from '../utils/base-tool.js';
import { secureApiClient, UpdateProjectApiResponse } from '../utils/secure-api-client.js'; // Use secure API client
import { logger } from '../utils/logger.js';

// Removed local UpdateProjectResponse as UpdateProjectApiResponse from api-client.ts will be used.

/**
 * Secure schema for project knowledge data
 * Prevents JSON injection while maintaining flexibility
 */
const ProjectKnowledgeSchema = z.object({
  // Core project information
  components: z.array(z.string().max(100, "Component name too long")).max(50, "Too many components").optional(),
  dependencies: z.array(z.string().max(100, "Dependency name too long")).max(50, "Too many dependencies").optional(),
  technologies: z.array(z.string().max(50, "Technology name too long")).max(20, "Too many technologies").optional(),
  
  // Architecture and design
  architecture: z.string().max(2000, "Architecture description too long").optional(),
  patterns: z.array(z.string().max(100, "Pattern name too long")).max(20, "Too many patterns").optional(),
  
  // Documentation and notes
  notes: z.string().max(5000, "Notes too long").optional(),
  links: z.array(z.string().url("Invalid URL format").max(500, "URL too long")).max(10, "Too many links").optional(),
  
  // Custom metadata (controlled)
  metadata: z.record(z.string().max(500, "Metadata value too long")).optional(),
}).strict();

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
  readonly description = "Updates a project's knowledge graph data and/or its structure diagram (in Mermaid.js format). The project is identified by its unique 'slug'. At least one of 'project_knowledge' or 'project_diagram' must be provided for an update to occur.";
  readonly zodSchema = UpdateProjectSchema; // Renamed from schema
  readonly annotations: ToolAnnotations = {
    title: "Update Project",
    readOnlyHint: false, // This tool modifies data
    destructiveHint: false, // Assuming updates are not inherently destructive but additive or modifying
    idempotentHint: false, // Multiple identical updates might have different outcomes if not designed for idempotency
    openWorldHint: true, // Interacts with an external API
  };
  
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
            description: "The unique three-letter identifier for the project to be updated (e.g., 'CRD' or 'crd'). Case insensitive - will be converted to uppercase."
          },
          project_knowledge: {
            type: "object",
            // No specific properties for project_knowledge, as it's z.record(z.any())
            description: "Optional. A JSON object representing the project's knowledge graph. If provided, this will update the existing knowledge data. (max 50 components, 20 technologies, 5000 chars for notes)"
          },
          project_diagram: {
            type: "string",
            description: "Optional. A string containing the project's structure diagram in Mermaid.js format. If provided, this will update the existing diagram. (max 15000 characters)"
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
      // Extract project slug
      const { slug, ...updateData } = input;
      
      // Update project using the API endpoint
      const url = `/project/slug/${slug.toUpperCase()}`;
      logger.debug(`Making PUT request to: ${url}`);
      
      const responseData = await secureApiClient.put<UpdateProjectApiResponse>(url, updateData) as unknown as UpdateProjectApiResponse;

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
