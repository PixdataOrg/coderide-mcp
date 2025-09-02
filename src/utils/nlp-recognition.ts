/**
 * NLP Recognition System for CodeRide MCP
 * Enhances agent understanding of natural language project references
 */
import { logger } from './logger.js';

/**
 * Project context recognition patterns
 */
export interface ProjectRecognitionPattern {
  triggers: string[];
  projectSlug?: string;
  suggestedAction: string;
  confidence: number;
}

/**
 * User intent mapping for workflow automation
 */
export interface UserIntentMapping {
  intent: string;
  triggers: string[];
  recommendedTools: string[];
  workflowPhase: 'discovery' | 'context' | 'analysis' | 'implementation' | 'completion';
}

/**
 * NLP Recognition configuration
 */
export interface NLPRecognitionConfig {
  projectPatterns: ProjectRecognitionPattern[];
  intentMappings: UserIntentMapping[];
  contextualKeywords: string[];
}

/**
 * NLP Recognition System for enhanced agent understanding
 */
export class NLPRecognitionSystem {
  private static instance: NLPRecognitionSystem;
  private config: NLPRecognitionConfig;

  private constructor() {
    this.config = this.initializeDefaultConfig();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NLPRecognitionSystem {
    if (!NLPRecognitionSystem.instance) {
      NLPRecognitionSystem.instance = new NLPRecognitionSystem();
    }
    return NLPRecognitionSystem.instance;
  }

  /**
   * Initialize default NLP recognition configuration
   */
  private initializeDefaultConfig(): NLPRecognitionConfig {
    return {
      projectPatterns: [
        {
          triggers: ['continue project', 'work on project', 'project', 'continue with'],
          suggestedAction: 'Use CodeRide MCP to get project context and continue work',
          confidence: 0.8
        },
        {
          triggers: ['makestorytime', 'make story time', 'story time'],
          projectSlug: 'MST',
          suggestedAction: 'Get MakeStoryTime project context using get_project tool',
          confidence: 0.9
        },
        {
          triggers: ['coderide', 'code ride', 'task management'],
          projectSlug: 'CRD',
          suggestedAction: 'Get CodeRide project context using get_project tool',
          confidence: 0.9
        }
      ],
      intentMappings: [
        {
          intent: 'start_project_work',
          triggers: ['start working on', 'begin project', 'continue project', 'work on'],
          recommendedTools: ['list_projects', 'get_project', 'list_tasks'],
          workflowPhase: 'discovery'
        },
        {
          intent: 'get_task_details',
          triggers: ['what is task', 'task details', 'show task', 'get task'],
          recommendedTools: ['get_task', 'get_prompt'],
          workflowPhase: 'context'
        },
        {
          intent: 'update_progress',
          triggers: ['update task', 'mark complete', 'task done', 'finished task'],
          recommendedTools: ['update_task', 'update_project'],
          workflowPhase: 'completion'
        },
        {
          intent: 'find_next_work',
          triggers: ['next task', 'what\'s next', 'continue work', 'next step'],
          recommendedTools: ['next_task', 'list_tasks'],
          workflowPhase: 'discovery'
        }
      ],
      contextualKeywords: [
        'project', 'task', 'implement', 'complete', 'update', 'continue',
        'work', 'build', 'create', 'fix', 'develop', 'code', 'feature'
      ]
    };
  }

  /**
   * Analyze user input for project references and intent
   */
  analyzeUserInput(input: string): {
    projectRecognition: ProjectRecognitionPattern | null;
    intentMapping: UserIntentMapping | null;
    contextualKeywords: string[];
    recommendations: string[];
  } {
    const normalizedInput = input.toLowerCase().trim();
    logger.debug(`Analyzing user input for NLP recognition: "${input}"`);

    // Analyze project recognition
    const projectRecognition = this.detectProjectReference(normalizedInput);
    
    // Analyze user intent
    const intentMapping = this.detectUserIntent(normalizedInput);
    
    // Extract contextual keywords
    const contextualKeywords = this.extractContextualKeywords(normalizedInput);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      projectRecognition,
      intentMapping,
      contextualKeywords
    );

    const result = {
      projectRecognition,
      intentMapping,
      contextualKeywords,
      recommendations
    };

    logger.debug('NLP analysis result:', result);
    return result;
  }

  /**
   * Detect project references in user input
   */
  private detectProjectReference(input: string): ProjectRecognitionPattern | null {
    let bestMatch: ProjectRecognitionPattern | null = null;
    let highestConfidence = 0;

    for (const pattern of this.config.projectPatterns) {
      for (const trigger of pattern.triggers) {
        if (input.includes(trigger.toLowerCase())) {
          if (pattern.confidence > highestConfidence) {
            bestMatch = pattern;
            highestConfidence = pattern.confidence;
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Detect user intent from input
   */
  private detectUserIntent(input: string): UserIntentMapping | null {
    for (const mapping of this.config.intentMappings) {
      for (const trigger of mapping.triggers) {
        if (input.includes(trigger.toLowerCase())) {
          return mapping;
        }
      }
    }
    return null;
  }

  /**
   * Extract contextual keywords from input
   */
  private extractContextualKeywords(input: string): string[] {
    const found: string[] = [];
    for (const keyword of this.config.contextualKeywords) {
      if (input.includes(keyword.toLowerCase())) {
        found.push(keyword);
      }
    }
    return found;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    projectRecognition: ProjectRecognitionPattern | null,
    intentMapping: UserIntentMapping | null,
    contextualKeywords: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Project-specific recommendations
    if (projectRecognition) {
      recommendations.push(projectRecognition.suggestedAction);
      
      if (projectRecognition.projectSlug) {
        recommendations.push(`Use get_project with slug: ${projectRecognition.projectSlug}`);
        recommendations.push(`Use list_tasks to see available tasks for ${projectRecognition.projectSlug}`);
      }
    }

    // Intent-based recommendations
    if (intentMapping) {
      recommendations.push(`Detected intent: ${intentMapping.intent}`);
      recommendations.push(`Recommended workflow phase: ${intentMapping.workflowPhase}`);
      
      for (const tool of intentMapping.recommendedTools) {
        recommendations.push(`Consider using tool: ${tool}`);
      }
    }

    // Contextual recommendations
    if (contextualKeywords.length > 0) {
      recommendations.push(`Detected context keywords: ${contextualKeywords.join(', ')}`);
      
      if (contextualKeywords.includes('project') && !projectRecognition) {
        recommendations.push('Consider using list_projects to see available projects');
      }
      
      if (contextualKeywords.includes('task') && !intentMapping) {
        recommendations.push('Consider using list_tasks or get_task for task operations');
      }
    }

    // Default recommendation if no specific patterns detected
    if (recommendations.length === 0) {
      recommendations.push('Use CodeRide MCP tools for project and task management');
      recommendations.push('Start with list_projects to see available projects');
    }

    return recommendations;
  }

  /**
   * Add custom project pattern
   */
  addProjectPattern(pattern: ProjectRecognitionPattern): void {
    this.config.projectPatterns.push(pattern);
    logger.info(`Added custom project pattern with ${pattern.triggers.length} triggers`);
  }

  /**
   * Add custom intent mapping
   */
  addIntentMapping(mapping: UserIntentMapping): void {
    this.config.intentMappings.push(mapping);
    logger.info(`Added custom intent mapping for: ${mapping.intent}`);
  }

  /**
   * Update contextual keywords
   */
  updateContextualKeywords(keywords: string[]): void {
    this.config.contextualKeywords = [...this.config.contextualKeywords, ...keywords];
    logger.info(`Updated contextual keywords, now ${this.config.contextualKeywords.length} total`);
  }

  /**
   * Get current configuration
   */
  getConfig(): NLPRecognitionConfig {
    return { ...this.config };
  }

  /**
   * Generate enhanced agent instructions with NLP insights
   */
  generateEnhancedInstructions(
    analysis: ReturnType<typeof this.analyzeUserInput>,
    baseInstructions: any
  ): any {
    const enhanced = { ...baseInstructions };

    // Add NLP-specific guidance
    enhanced.nlpGuidance = {
      userIntentMapping: analysis.intentMapping ? {
        [analysis.intentMapping.intent]: analysis.intentMapping.recommendedTools
      } : {},
      workflowTriggers: analysis.intentMapping ? {
        [analysis.intentMapping.intent]: analysis.intentMapping.workflowPhase
      } : {},
      contextualKeywords: analysis.contextualKeywords,
      projectRecognition: analysis.projectRecognition
    };

    // Enhance immediate actions with NLP recommendations
    if (analysis.recommendations.length > 0) {
      enhanced.immediateActions = [
        ...enhanced.immediateActions,
        'NLP Analysis completed - user intent detected',
        ...analysis.recommendations.slice(0, 3) // Top 3 recommendations
      ];
    }

    // Update recommended tools based on intent
    if (analysis.intentMapping) {
      enhanced.nextRecommendedTools = [
        ...enhanced.nextRecommendedTools,
        ...analysis.intentMapping.recommendedTools
      ];
    }

    // Add project-specific guidance
    if (analysis.projectRecognition?.projectSlug) {
      enhanced.contextRequired = [
        `Project context for ${analysis.projectRecognition.projectSlug}`,
        'Current task status and requirements'
      ];
    }

    return enhanced;
  }
}

/**
 * Convenience function to analyze user input
 */
export function analyzeUserInput(input: string) {
  return NLPRecognitionSystem.getInstance().analyzeUserInput(input);
}

/**
 * Convenience function to generate enhanced instructions
 */
export function generateEnhancedInstructions(
  userInput: string,
  baseInstructions: any
): any {
  const nlp = NLPRecognitionSystem.getInstance();
  const analysis = nlp.analyzeUserInput(userInput);
  return nlp.generateEnhancedInstructions(analysis, baseInstructions);
}
