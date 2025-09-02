/**
 * Project Knowledge Optimization for CodeRide MCP
 * Standardizes and optimizes project knowledge and diagram management
 */
import { logger } from './logger.js';

/**
 * Standardized project knowledge schema
 */
export interface StandardizedProjectKnowledge {
  // Core Architecture
  architecture: {
    type: 'monolith' | 'microservices' | 'serverless' | 'hybrid';
    description: string;
    lastUpdated: string;
  };
  
  // Component Registry
  components: {
    [componentId: string]: {
      name: string;
      type: 'frontend' | 'backend' | 'database' | 'service' | 'utility';
      status: 'planned' | 'in-progress' | 'completed' | 'deprecated';
      dependencies: string[];
      technologies: string[];
      description: string;
      lastModified: string;
    };
  };
  
  // Technology Stack
  technologies: {
    [category: string]: {
      primary: string[];
      secondary: string[];
      planned: string[];
    };
  };
  
  // Implementation Patterns
  patterns: {
    [patternName: string]: {
      type: 'design' | 'architectural' | 'integration';
      description: string;
      usedIn: string[]; // component IDs
      rationale: string;
    };
  };
  
  // Task Impact Tracking
  taskImpacts: {
    [taskNumber: string]: {
      componentsAffected: string[];
      technologiesAdded: string[];
      patternsIntroduced: string[];
      architecturalChanges: string[];
      timestamp: string;
    };
  };
  
  // Metadata
  metadata: {
    lastFullUpdate: string;
    version: string;
    maintainer: string;
  };
}

/**
 * Knowledge update plan
 */
export interface KnowledgeUpdatePlan {
  componentsToUpdate: string[];
  technologiesToAdd: string[];
  patternsToDocument: string[];
  architecturalChanges: string[];
  priority: 'critical' | 'important' | 'optional';
}

/**
 * Diagram update plan
 */
export interface DiagramUpdatePlan {
  sectionsToUpdate: string[];
  newComponents: string[];
  removedComponents: string[];
  relationshipChanges: string[];
  priority: 'critical' | 'important' | 'optional';
}

/**
 * Project update intelligence result
 */
export interface ProjectUpdateIntelligence {
  knowledgeUpdates: KnowledgeUpdatePlan;
  diagramUpdates: DiagramUpdatePlan;
  priority: 'critical' | 'important' | 'optional';
  updateSequence: string[];
}

/**
 * Consistency validation result
 */
export interface ConsistencyValidationResult {
  isConsistent: boolean;
  missingInDiagram: string[];
  missingInKnowledge: string[];
  recommendations: string[];
  schemaCompliance: {
    isValid: boolean;
    missingFields: string[];
    invalidFields: string[];
    suggestions: string[];
  };
}

/**
 * Project Knowledge Optimizer for intelligent project management
 */
export class ProjectKnowledgeOptimizer {
  private static instance: ProjectKnowledgeOptimizer;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ProjectKnowledgeOptimizer {
    if (!ProjectKnowledgeOptimizer.instance) {
      ProjectKnowledgeOptimizer.instance = new ProjectKnowledgeOptimizer();
    }
    return ProjectKnowledgeOptimizer.instance;
  }

  /**
   * Detect required updates based on task completion
   */
  detectRequiredUpdates(taskData: any, projectContext: any): ProjectUpdateIntelligence {
    logger.debug('Detecting required project updates', { taskNumber: taskData.number, taskStatus: taskData.status });

    const knowledgeUpdates = this.analyzeKnowledgeUpdates(taskData, projectContext);
    const diagramUpdates = this.analyzeDiagramUpdates(taskData, projectContext);
    
    // Determine overall priority
    const priority = this.determinePriority(knowledgeUpdates, diagramUpdates);
    
    // Generate update sequence
    const updateSequence = this.generateUpdateSequence(knowledgeUpdates, diagramUpdates);

    return {
      knowledgeUpdates,
      diagramUpdates,
      priority,
      updateSequence
    };
  }

  /**
   * Analyze knowledge updates needed
   */
  private analyzeKnowledgeUpdates(taskData: any, projectContext: any): KnowledgeUpdatePlan {
    const componentsToUpdate: string[] = [];
    const technologiesToAdd: string[] = [];
    const patternsToDocument: string[] = [];
    const architecturalChanges: string[] = [];

    // Analyze task description for component mentions
    if (taskData.description) {
      const componentKeywords = ['component', 'service', 'module', 'api', 'database', 'frontend', 'backend'];
      for (const keyword of componentKeywords) {
        if (taskData.description.toLowerCase().includes(keyword)) {
          componentsToUpdate.push(`${taskData.number}-${keyword}`);
        }
      }
    }

    // Analyze for technology mentions
    if (taskData.description) {
      const techKeywords = ['react', 'node', 'typescript', 'database', 'api', 'auth', 'oauth', 'jwt'];
      for (const tech of techKeywords) {
        if (taskData.description.toLowerCase().includes(tech)) {
          technologiesToAdd.push(tech);
        }
      }
    }

    // Analyze for pattern mentions
    if (taskData.description) {
      const patternKeywords = ['pattern', 'middleware', 'repository', 'factory', 'singleton', 'observer'];
      for (const pattern of patternKeywords) {
        if (taskData.description.toLowerCase().includes(pattern)) {
          patternsToDocument.push(pattern);
        }
      }
    }

    // Determine priority based on task status and content
    let priority: 'critical' | 'important' | 'optional' = 'optional';
    if (taskData.status === 'completed') {
      priority = 'important';
    }
    if (componentsToUpdate.length > 0 || technologiesToAdd.length > 0) {
      priority = 'critical';
    }

    return {
      componentsToUpdate,
      technologiesToAdd,
      patternsToDocument,
      architecturalChanges,
      priority
    };
  }

  /**
   * Analyze diagram updates needed
   */
  private analyzeDiagramUpdates(taskData: any, projectContext: any): DiagramUpdatePlan {
    const sectionsToUpdate: string[] = [];
    const newComponents: string[] = [];
    const removedComponents: string[] = [];
    const relationshipChanges: string[] = [];

    // Analyze for new components
    if (taskData.description) {
      const componentIndicators = ['new component', 'add component', 'create service', 'new module'];
      for (const indicator of componentIndicators) {
        if (taskData.description.toLowerCase().includes(indicator)) {
          newComponents.push(`${taskData.number}-component`);
          sectionsToUpdate.push('components');
        }
      }
    }

    // Analyze for relationship changes
    if (taskData.description) {
      const relationshipIndicators = ['connect', 'integrate', 'link', 'relationship', 'dependency'];
      for (const indicator of relationshipIndicators) {
        if (taskData.description.toLowerCase().includes(indicator)) {
          relationshipChanges.push(`${taskData.number}-relationship`);
          sectionsToUpdate.push('relationships');
        }
      }
    }

    // Determine priority
    let priority: 'critical' | 'important' | 'optional' = 'optional';
    if (newComponents.length > 0 || relationshipChanges.length > 0) {
      priority = 'important';
    }
    if (taskData.status === 'completed' && (newComponents.length > 0 || relationshipChanges.length > 0)) {
      priority = 'critical';
    }

    return {
      sectionsToUpdate,
      newComponents,
      removedComponents,
      relationshipChanges,
      priority
    };
  }

  /**
   * Determine overall priority
   */
  private determinePriority(
    knowledgeUpdates: KnowledgeUpdatePlan,
    diagramUpdates: DiagramUpdatePlan
  ): 'critical' | 'important' | 'optional' {
    if (knowledgeUpdates.priority === 'critical' || diagramUpdates.priority === 'critical') {
      return 'critical';
    }
    if (knowledgeUpdates.priority === 'important' || diagramUpdates.priority === 'important') {
      return 'important';
    }
    return 'optional';
  }

  /**
   * Generate update sequence
   */
  private generateUpdateSequence(
    knowledgeUpdates: KnowledgeUpdatePlan,
    diagramUpdates: DiagramUpdatePlan
  ): string[] {
    const sequence: string[] = [];

    // Always start with analysis
    sequence.push('analyze_task_impact');

    // Update knowledge first (provides context for diagram)
    if (knowledgeUpdates.componentsToUpdate.length > 0 || 
        knowledgeUpdates.technologiesToAdd.length > 0 ||
        knowledgeUpdates.patternsToDocument.length > 0) {
      sequence.push('update_project_knowledge');
    }

    // Then update diagram (uses knowledge context)
    if (diagramUpdates.newComponents.length > 0 ||
        diagramUpdates.relationshipChanges.length > 0 ||
        diagramUpdates.sectionsToUpdate.length > 0) {
      sequence.push('update_project_diagram');
    }

    // Always end with validation
    sequence.push('validate_consistency');

    return sequence;
  }

  /**
   * Extract knowledge from task completion
   */
  extractKnowledgeFromTask(taskData: any): Partial<StandardizedProjectKnowledge> {
    const timestamp = new Date().toISOString();
    
    // Extract components affected
    const componentsAffected = this.extractComponentsFromTask(taskData);
    
    // Extract technologies added
    const technologiesAdded = this.extractTechnologiesFromTask(taskData);
    
    // Extract patterns introduced
    const patternsIntroduced = this.extractPatternsFromTask(taskData);
    
    // Extract architectural changes
    const architecturalChanges = this.extractArchitecturalChanges(taskData);

    const knowledge: Partial<StandardizedProjectKnowledge> = {
      taskImpacts: {
        [taskData.number]: {
          componentsAffected,
          technologiesAdded,
          patternsIntroduced,
          architecturalChanges,
          timestamp
        }
      },
      metadata: {
        lastFullUpdate: timestamp,
        version: '1.0.0',
        maintainer: 'CodeRide MCP Agent'
      }
    };

    logger.debug('Extracted knowledge from task:', { taskNumber: taskData.number, knowledge });
    return knowledge;
  }

  /**
   * Extract components from task
   */
  private extractComponentsFromTask(taskData: any): string[] {
    const components: string[] = [];
    const description = taskData.description?.toLowerCase() || '';
    
    // Component detection patterns
    const componentPatterns = [
      /(\w+)\s+component/g,
      /(\w+)\s+service/g,
      /(\w+)\s+module/g,
      /(\w+)\s+api/g
    ];

    for (const pattern of componentPatterns) {
      const matches = description.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2) {
          components.push(match[1]);
        }
      }
    }

    return [...new Set(components)]; // Remove duplicates
  }

  /**
   * Extract technologies from task
   */
  private extractTechnologiesFromTask(taskData: any): string[] {
    const technologies: string[] = [];
    const description = taskData.description?.toLowerCase() || '';
    
    // Technology keywords
    const techKeywords = [
      'react', 'vue', 'angular', 'typescript', 'javascript',
      'node.js', 'express', 'fastify', 'nest.js',
      'mongodb', 'postgresql', 'mysql', 'redis',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp',
      'jwt', 'oauth', 'auth0', 'passport',
      'graphql', 'rest', 'grpc', 'websocket'
    ];

    for (const tech of techKeywords) {
      if (description.includes(tech)) {
        technologies.push(tech);
      }
    }

    return technologies;
  }

  /**
   * Extract patterns from task
   */
  private extractPatternsFromTask(taskData: any): string[] {
    const patterns: string[] = [];
    const description = taskData.description?.toLowerCase() || '';
    
    // Pattern keywords
    const patternKeywords = [
      'middleware', 'repository', 'factory', 'singleton',
      'observer', 'strategy', 'decorator', 'adapter',
      'mvc', 'mvvm', 'clean architecture', 'hexagonal'
    ];

    for (const pattern of patternKeywords) {
      if (description.includes(pattern)) {
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Extract architectural changes from task
   */
  private extractArchitecturalChanges(taskData: any): string[] {
    const changes: string[] = [];
    const description = taskData.description?.toLowerCase() || '';
    
    // Architectural change indicators
    const changeIndicators = [
      'refactor', 'restructure', 'migrate', 'upgrade',
      'new architecture', 'change structure', 'redesign'
    ];

    for (const indicator of changeIndicators) {
      if (description.includes(indicator)) {
        changes.push(indicator);
      }
    }

    return changes;
  }

  /**
   * Generate diagram updates from knowledge changes
   */
  generateDiagramFromKnowledge(knowledge: Partial<StandardizedProjectKnowledge>): string {
    let diagram = '';
    
    // Start with basic Mermaid graph
    diagram += 'graph TD\n';
    
    // Add components
    if (knowledge.components) {
      for (const [id, component] of Object.entries(knowledge.components)) {
        const shape = this.getComponentShape(component.type);
        diagram += `    ${id}${shape}\n`;
      }
    }
    
    // Add relationships based on dependencies
    if (knowledge.components) {
      for (const [id, component] of Object.entries(knowledge.components)) {
        for (const dep of component.dependencies) {
          diagram += `    ${id} --> ${dep}\n`;
        }
      }
    }
    
    logger.debug('Generated diagram from knowledge:', { diagramLength: diagram.length });
    return diagram;
  }

  /**
   * Get Mermaid shape for component type
   */
  private getComponentShape(type: string): string {
    const shapes = {
      'frontend': '[Frontend]',
      'backend': '(Backend)',
      'database': '[(Database)]',
      'service': '{{Service}}',
      'utility': '[/Utility\\]'
    };
    
    return shapes[type as keyof typeof shapes] || '[Component]';
  }

  /**
   * Validate consistency between knowledge and diagram
   */
  validateConsistency(knowledge: any, diagram: string): ConsistencyValidationResult {
    const missingInDiagram: string[] = [];
    const missingInKnowledge: string[] = [];
    const recommendations: string[] = [];

    // Extract components from diagram
    const diagramComponents = this.extractComponentsFromDiagram(diagram);
    
    // Extract components from knowledge
    const knowledgeComponents = knowledge.components ? Object.keys(knowledge.components) : [];

    // Find missing components
    for (const component of knowledgeComponents) {
      if (!diagramComponents.includes(component)) {
        missingInDiagram.push(component);
      }
    }

    for (const component of diagramComponents) {
      if (!knowledgeComponents.includes(component)) {
        missingInKnowledge.push(component);
      }
    }

    // Generate recommendations
    if (missingInDiagram.length > 0) {
      recommendations.push(`Add ${missingInDiagram.length} components to diagram: ${missingInDiagram.join(', ')}`);
    }
    
    if (missingInKnowledge.length > 0) {
      recommendations.push(`Add ${missingInKnowledge.length} components to knowledge: ${missingInKnowledge.join(', ')}`);
    }

    // Validate schema compliance
    const schemaCompliance = this.validateSchemaCompliance(knowledge);

    const isConsistent = missingInDiagram.length === 0 && 
                        missingInKnowledge.length === 0 && 
                        schemaCompliance.isValid;

    logger.debug('Consistency validation result:', { 
      isConsistent, 
      missingInDiagram: missingInDiagram.length,
      missingInKnowledge: missingInKnowledge.length 
    });

    return {
      isConsistent,
      missingInDiagram,
      missingInKnowledge,
      recommendations,
      schemaCompliance
    };
  }

  /**
   * Extract components from Mermaid diagram
   */
  private extractComponentsFromDiagram(diagram: string): string[] {
    const components: string[] = [];
    const lines = diagram.split('\n');
    
    for (const line of lines) {
      // Match Mermaid node definitions
      const nodeMatch = line.match(/^\s*(\w+)[\[\({\\/]/);
      if (nodeMatch) {
        components.push(nodeMatch[1]);
      }
    }
    
    return [...new Set(components)];
  }

  /**
   * Validate schema compliance
   */
  private validateSchemaCompliance(knowledge: any): {
    isValid: boolean;
    missingFields: string[];
    invalidFields: string[];
    suggestions: string[];
  } {
    const missingFields: string[] = [];
    const invalidFields: string[] = [];
    const suggestions: string[] = [];

    // Check required top-level fields
    const requiredFields = ['architecture', 'components', 'technologies', 'patterns', 'taskImpacts', 'metadata'];
    
    for (const field of requiredFields) {
      if (!knowledge[field]) {
        missingFields.push(field);
      }
    }

    // Validate architecture structure
    if (knowledge.architecture) {
      const archRequiredFields = ['type', 'description', 'lastUpdated'];
      for (const field of archRequiredFields) {
        if (!knowledge.architecture[field]) {
          missingFields.push(`architecture.${field}`);
        }
      }
    }

    // Generate suggestions
    if (missingFields.length > 0) {
      suggestions.push('Initialize missing fields with default values');
      suggestions.push('Follow standardized project knowledge schema');
    }

    const isValid = missingFields.length === 0 && invalidFields.length === 0;

    return {
      isValid,
      missingFields,
      invalidFields,
      suggestions
    };
  }

  /**
   * Generate optimization instructions for agent
   */
  generateOptimizationInstructions(
    taskData: any,
    projectContext: any
  ): {
    optimizationRequired: boolean;
    updatePlan: ProjectUpdateIntelligence;
    instructions: string[];
    validationRequired: boolean;
  } {
    const updatePlan = this.detectRequiredUpdates(taskData, projectContext);
    
    const instructions: string[] = [];
    
    // Add specific instructions based on update plan
    if (updatePlan.priority === 'critical') {
      instructions.push('CRITICAL: Project knowledge and diagram updates required');
    }
    
    for (const step of updatePlan.updateSequence) {
      switch (step) {
        case 'analyze_task_impact':
          instructions.push('Analyze task impact on project architecture');
          break;
        case 'update_project_knowledge':
          instructions.push('Update project knowledge with task implementation details');
          break;
        case 'update_project_diagram':
          instructions.push('Update project diagram to reflect architectural changes');
          break;
        case 'validate_consistency':
          instructions.push('Validate consistency between knowledge and diagram');
          break;
      }
    }

    return {
      optimizationRequired: updatePlan.priority !== 'optional',
      updatePlan,
      instructions,
      validationRequired: true
    };
  }
}

/**
 * Convenience function to detect required updates
 */
export function detectRequiredUpdates(taskData: any, projectContext: any): ProjectUpdateIntelligence {
  return ProjectKnowledgeOptimizer.getInstance().detectRequiredUpdates(taskData, projectContext);
}

/**
 * Convenience function to extract knowledge from task
 */
export function extractKnowledgeFromTask(taskData: any): Partial<StandardizedProjectKnowledge> {
  return ProjectKnowledgeOptimizer.getInstance().extractKnowledgeFromTask(taskData);
}

/**
 * Convenience function to validate consistency
 */
export function validateConsistency(knowledge: any, diagram: string): ConsistencyValidationResult {
  return ProjectKnowledgeOptimizer.getInstance().validateConsistency(knowledge, diagram);
}

/**
 * Convenience function to generate optimization instructions
 */
export function generateOptimizationInstructions(taskData: any, projectContext: any) {
  return ProjectKnowledgeOptimizer.getInstance().generateOptimizationInstructions(taskData, projectContext);
}
