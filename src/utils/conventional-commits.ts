/**
 * Conventional Commits Automation for CodeRide MCP
 * Implements Conventional Commits 1.0.0 specification
 */
import { spawn } from 'child_process';
import { logger } from './logger.js';
import { InputValidator } from './input-validator.js';

/**
 * Conventional commit types following the specification
 */
export type ConventionalCommitType = 
  | 'feat'     // New feature
  | 'fix'      // Bug fix
  | 'docs'     // Documentation changes
  | 'style'    // Code style changes (formatting, etc.)
  | 'refactor' // Code refactoring
  | 'perf'     // Performance improvements
  | 'test'     // Adding or updating tests
  | 'build'    // Build system changes
  | 'ci'       // CI configuration changes
  | 'chore'    // Other changes (maintenance, etc.)
  | 'revert';  // Reverting previous commits

/**
 * Conventional commit configuration
 */
export interface ConventionalCommitConfig {
  type: ConventionalCommitType;
  scope?: string;
  description: string;
  body?: string;
  footer?: string;
  breakingChange?: boolean;
  breakingChangeDescription?: string;
}

/**
 * Git operation result
 */
export interface GitOperationResult {
  success: boolean;
  output: string;
  error?: string;
  commitHash?: string;
}

/**
 * Semantic version impact based on conventional commits
 */
export type SemVerImpact = 'major' | 'minor' | 'patch' | 'none';

/**
 * Conventional Commits Generator and Git Automation
 */
export class ConventionalCommitsManager {
  private static instance: ConventionalCommitsManager;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ConventionalCommitsManager {
    if (!ConventionalCommitsManager.instance) {
      ConventionalCommitsManager.instance = new ConventionalCommitsManager();
    }
    return ConventionalCommitsManager.instance;
  }

  /**
   * Generate conventional commit message from configuration
   */
  generateCommitMessage(config: ConventionalCommitConfig): string {
    // Validate configuration
    this.validateCommitConfig(config);

    // Build the commit message according to Conventional Commits 1.0.0
    let message = '';

    // Type and scope
    if (config.scope) {
      message += `${config.type}(${config.scope})`;
    } else {
      message += config.type;
    }

    // Breaking change indicator
    if (config.breakingChange) {
      message += '!';
    }

    // Description
    message += `: ${config.description}`;

    // Body (optional)
    if (config.body) {
      message += `\n\n${config.body}`;
    }

    // Footer (optional)
    if (config.footer) {
      message += `\n\n${config.footer}`;
    }

    // Breaking change footer (if not already indicated with !)
    if (config.breakingChange && config.breakingChangeDescription) {
      if (!config.footer) {
        message += '\n\n';
      } else {
        message += '\n';
      }
      message += `BREAKING CHANGE: ${config.breakingChangeDescription}`;
    }

    logger.debug('Generated conventional commit message:', { message });
    return message;
  }

  /**
   * Validate commit configuration
   */
  private validateCommitConfig(config: ConventionalCommitConfig): void {
    // Validate type
    const validTypes: ConventionalCommitType[] = [
      'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 
      'test', 'build', 'ci', 'chore', 'revert'
    ];
    
    if (!validTypes.includes(config.type)) {
      throw new Error(`Invalid commit type: ${config.type}. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate description
    if (!config.description || config.description.trim().length === 0) {
      throw new Error('Commit description is required');
    }

    if (config.description.length > 100) {
      throw new Error('Commit description should not exceed 100 characters');
    }

    // Validate scope (if provided)
    if (config.scope) {
      if (config.scope.length > 50) {
        throw new Error('Commit scope should not exceed 50 characters');
      }
      
      // Scope should not contain special characters
      if (!/^[a-zA-Z0-9-_]+$/.test(config.scope)) {
        throw new Error('Commit scope should only contain alphanumeric characters, hyphens, and underscores');
      }
    }

    // Validate body (if provided)
    if (config.body && config.body.length > 1000) {
      throw new Error('Commit body should not exceed 1000 characters');
    }

    // Validate footer (if provided)
    if (config.footer && config.footer.length > 500) {
      throw new Error('Commit footer should not exceed 500 characters');
    }
  }

  /**
   * Determine commit type based on tool and action context
   */
  determineCommitType(toolName: string, input: any, result: any): ConventionalCommitType {
    // Task-related commits
    if (toolName === 'update_task') {
      if (input.status === 'completed') {
        return 'feat'; // Task completion is a feature
      } else if (input.status === 'in-progress') {
        return 'chore'; // Status updates are maintenance
      } else if (input.description) {
        return 'docs'; // Description updates are documentation
      }
      return 'chore';
    }

    // Project-related commits
    if (toolName === 'update_project') {
      if (input.project_knowledge) {
        return 'docs'; // Knowledge updates are documentation
      }
      if (input.project_diagram) {
        return 'docs'; // Diagram updates are documentation
      }
      return 'docs';
    }

    // Default mapping for other tools
    const toolTypeMapping: Record<string, ConventionalCommitType> = {
      'get_project': 'chore',
      'get_task': 'chore',
      'get_prompt': 'chore',
      'list_projects': 'chore',
      'list_tasks': 'chore',
      'next_task': 'chore',
      'start_project': 'feat'
    };

    return toolTypeMapping[toolName] || 'chore';
  }

  /**
   * Determine commit scope based on input context
   */
  determineCommitScope(toolName: string, input: any): string | undefined {
    // Extract project slug or task number as scope
    if (input.slug) {
      return input.slug.toUpperCase();
    }
    
    if (input.number) {
      // Extract project part from task number (e.g., CRD-1 -> CRD)
      const projectPart = input.number.split('-')[0];
      return projectPart.toUpperCase();
    }

    // Tool-based scopes
    if (toolName.includes('project')) {
      return 'project';
    }
    
    if (toolName.includes('task')) {
      return 'task';
    }

    return undefined;
  }

  /**
   * Generate commit description based on tool action
   */
  generateCommitDescription(toolName: string, input: any, result: any): string {
    switch (toolName) {
      case 'update_task':
        if (input.status === 'completed') {
          return `complete task ${input.number}`;
        } else if (input.status === 'in-progress') {
          return `start working on task ${input.number}`;
        } else if (input.description) {
          return `update task ${input.number} description`;
        }
        return `update task ${input.number}`;

      case 'update_project':
        const updates: string[] = [];
        if (input.project_knowledge) updates.push('knowledge');
        if (input.project_diagram) updates.push('diagram');
        return `update project ${input.slug} ${updates.join(' and ')}`;

      case 'start_project':
        return `initialize project ${result.project?.slug || 'setup'}`;

      default:
        return `${toolName.replace('_', ' ')} operation`;
    }
  }

  /**
   * Determine semantic version impact
   */
  determineSemVerImpact(config: ConventionalCommitConfig): SemVerImpact {
    // Breaking changes = MAJOR
    if (config.breakingChange) {
      return 'major';
    }

    // Features = MINOR
    if (config.type === 'feat') {
      return 'minor';
    }

    // Bug fixes = PATCH
    if (config.type === 'fix') {
      return 'patch';
    }

    // Everything else = no version impact
    return 'none';
  }

  /**
   * Execute git command safely
   */
  private async executeGitCommand(command: string, args: string[]): Promise<GitOperationResult> {
    return new Promise((resolve) => {
      // Validate git command for security
      const allowedCommands = ['status', 'add', 'commit', 'diff', 'log'];
      if (!allowedCommands.includes(command)) {
        resolve({
          success: false,
          output: '',
          error: `Git command not allowed: ${command}`
        });
        return;
      }

      // Validate arguments
      for (const arg of args) {
        if (typeof arg !== 'string') {
          resolve({
            success: false,
            output: '',
            error: 'Git arguments must be strings'
          });
          return;
        }
      }

      const child = spawn('git', [command, ...args], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const success = code === 0;
        
        // Extract commit hash from output if it's a commit command
        let commitHash: string | undefined;
        if (success && command === 'commit') {
          const hashMatch = stdout.match(/\[[\w-]+\s+([a-f0-9]{7,})\]/);
          if (hashMatch) {
            commitHash = hashMatch[1];
          }
        }

        resolve({
          success,
          output: stdout,
          error: success ? undefined : stderr,
          commitHash
        });
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: `Git process error: ${error.message}`
        });
      });

      // Set timeout for git operations
      setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          success: false,
          output: '',
          error: 'Git operation timed out'
        });
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Check git status
   */
  async getGitStatus(): Promise<GitOperationResult> {
    logger.debug('Checking git status');
    return this.executeGitCommand('status', ['--porcelain']);
  }

  /**
   * Stage files for commit
   */
  async stageFiles(files: string[] = ['.']): Promise<GitOperationResult> {
    logger.debug('Staging files for commit:', { files });
    
    // Validate file paths
    for (const file of files) {
      if (file.includes('..') || file.startsWith('/')) {
        return {
          success: false,
          output: '',
          error: `Invalid file path: ${file}`
        };
      }
    }

    return this.executeGitCommand('add', files);
  }

  /**
   * Create conventional commit
   */
  async createCommit(config: ConventionalCommitConfig): Promise<GitOperationResult> {
    try {
      // Generate commit message
      const message = this.generateCommitMessage(config);
      
      logger.info('Creating conventional commit:', { type: config.type, scope: config.scope, description: config.description });
      
      // Execute git commit
      const result = await this.executeGitCommand('commit', ['-m', message]);
      
      if (result.success) {
        logger.info(`✅ Commit created successfully: ${result.commitHash || 'unknown hash'}`);
      } else {
        logger.error('❌ Commit failed:', undefined, { error: result.error || 'Unknown error' });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating commit:', error instanceof Error ? error : undefined, { message: errorMessage });
      
      return {
        success: false,
        output: '',
        error: errorMessage
      };
    }
  }

  /**
   * Generate commit configuration from tool context
   */
  generateCommitConfig(toolName: string, input: any, result: any): ConventionalCommitConfig {
    const type = this.determineCommitType(toolName, input, result);
    const scope = this.determineCommitScope(toolName, input);
    const description = this.generateCommitDescription(toolName, input, result);

    // Determine if this is a breaking change
    const breakingChange = this.isBreakingChange(toolName, input, result);

    const config: ConventionalCommitConfig = {
      type,
      scope,
      description,
      breakingChange
    };

    // Add body for significant changes
    if (type === 'feat' && input.status === 'completed') {
      config.body = `Task ${input.number} has been completed successfully.`;
    }

    return config;
  }

  /**
   * Determine if change is breaking
   */
  private isBreakingChange(toolName: string, input: any, result: any): boolean {
    // For now, we'll be conservative and not automatically mark things as breaking
    // This can be enhanced based on specific project needs
    return false;
  }

  /**
   * Generate git automation instructions for agent
   */
  generateGitInstructions(toolName: string, input: any, result: any): {
    gitCommitRequired: boolean;
    commitConfig: ConventionalCommitConfig;
    commitMessage: string;
    filesToStage: string[];
    preCommitChecks: string[];
    semanticVersionImpact: SemVerImpact;
  } {
    const commitConfig = this.generateCommitConfig(toolName, input, result);
    const commitMessage = this.generateCommitMessage(commitConfig);
    const semanticVersionImpact = this.determineSemVerImpact(commitConfig);

    return {
      gitCommitRequired: true,
      commitConfig,
      commitMessage,
      filesToStage: ['.'], // Stage all changes by default
      preCommitChecks: [
        'git status',
        'git diff --staged'
      ],
      semanticVersionImpact
    };
  }
}

/**
 * Convenience function to generate commit message
 */
export function generateCommitMessage(config: ConventionalCommitConfig): string {
  return ConventionalCommitsManager.getInstance().generateCommitMessage(config);
}

/**
 * Convenience function to create commit
 */
export async function createCommit(config: ConventionalCommitConfig): Promise<GitOperationResult> {
  return ConventionalCommitsManager.getInstance().createCommit(config);
}

/**
 * Convenience function to generate git instructions
 */
export function generateGitInstructions(toolName: string, input: any, result: any) {
  return ConventionalCommitsManager.getInstance().generateGitInstructions(toolName, input, result);
}

/**
 * Convenience function to get git status
 */
export async function getGitStatus(): Promise<GitOperationResult> {
  return ConventionalCommitsManager.getInstance().getGitStatus();
}

/**
 * Convenience function to stage files
 */
export async function stageFiles(files?: string[]): Promise<GitOperationResult> {
  return ConventionalCommitsManager.getInstance().stageFiles(files);
}
