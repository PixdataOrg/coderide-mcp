/**
 * Test Runner and Verification System for CodeRide MCP
 * Ensures tests pass before task completion
 */
import { spawn, SpawnOptions } from 'child_process';
import { logger } from './logger.js';
import { InputValidator } from './input-validator.js';

/**
 * Test execution result
 */
export interface TestResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  testsPassed: number;
  testsFailed: number;
  testsTotal: number;
}

/**
 * Test framework configuration
 */
export interface TestFrameworkConfig {
  framework: 'jest' | 'mocha' | 'vitest' | 'node' | 'npm' | 'custom';
  testPattern: string;
  configFile?: string;
  coverage?: boolean;
  command: string;
  args: string[];
}

/**
 * Test configuration
 */
export interface TestConfig {
  command: string;
  args: string[];
  timeout: number;
  workingDirectory: string;
  environment?: Record<string, string>;
  framework?: TestFrameworkConfig;
}

/**
 * Test suite classification
 */
export interface TestSuite {
  unitTests: string[];
  integrationTests: string[];
  e2eTests: string[];
  securityTests: string[];
}

/**
 * Coverage result
 */
export interface CoverageResult {
  lines: { total: number; covered: number; percentage: number };
  functions: { total: number; covered: number; percentage: number };
  branches: { total: number; covered: number; percentage: number };
  statements: { total: number; covered: number; percentage: number };
  overall: number;
}

/**
 * Enhanced test verification requirements
 */
export interface TestVerificationRequirements {
  mandatoryTests: string[];
  mandatoryUnitTests: string[];
  mandatoryIntegrationTests: string[];
  minimumPassRate: number;
  minimumUnitCoverage: number;
  minimumIntegrationPassRate: number;
  allowedFailures: string[];
  criticalTests: string[];
  criticalTestSuites: string[];
}

/**
 * Enhanced verification result
 */
export interface EnhancedVerificationResult {
  isValid: boolean;
  violations: string[];
  recommendations: string[];
  unitTestResults?: {
    isValid: boolean;
    violations: string[];
    coverage?: CoverageResult;
  };
  integrationTestResults?: {
    isValid: boolean;
    violations: string[];
  };
}

/**
 * Test Runner for automated testing verification
 */
export class TestRunner {
  private static instance: TestRunner;
  private defaultConfig: TestConfig;
  private verificationRequirements: TestVerificationRequirements;

  private constructor() {
    this.defaultConfig = this.initializeDefaultConfig();
    this.verificationRequirements = this.initializeVerificationRequirements();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TestRunner {
    if (!TestRunner.instance) {
      TestRunner.instance = new TestRunner();
    }
    return TestRunner.instance;
  }

  /**
   * Initialize default test configuration
   */
  private initializeDefaultConfig(): TestConfig {
    return {
      command: 'node',
      args: ['test/test-mcp-tools-integration.js'],
      timeout: 60000, // 60 seconds
      workingDirectory: process.cwd(),
      environment: {
        ...process.env,
        NODE_ENV: 'test'
      }
    };
  }

  /**
   * Initialize test verification requirements
   */
  private initializeVerificationRequirements(): TestVerificationRequirements {
    return {
      mandatoryTests: [
        'test-mcp-tools-integration.js',
        'security-validation-test.js'
      ],
      mandatoryUnitTests: [
        // Will be populated when unit tests are detected
      ],
      mandatoryIntegrationTests: [
        'test-mcp-tools-integration.js',
        'security-validation-test.js'
      ],
      minimumPassRate: 0.9, // 90% pass rate required
      minimumUnitCoverage: 0.8, // 80% unit test coverage required
      minimumIntegrationPassRate: 0.9, // 90% integration test pass rate
      allowedFailures: [], // No failures allowed for critical tests
      criticalTests: [
        'test-mcp-tools-integration.js',
        'security-validation-test.js',
        'test-api-auth.js'
      ],
      criticalTestSuites: [
        'integration',
        'security'
      ]
    };
  }

  /**
   * Run tests with the specified configuration
   */
  async runTests(config?: Partial<TestConfig>): Promise<TestResult> {
    const testConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();

    logger.info(`Starting test execution: ${testConfig.command} ${testConfig.args.join(' ')}`);

    try {
      // Validate test configuration
      this.validateTestConfig(testConfig);

      // Execute tests
      const result = await this.executeTests(testConfig);
      
      // Parse test results
      const parsedResult = this.parseTestOutput(result, startTime);
      
      // Log results
      this.logTestResults(parsedResult);
      
      return parsedResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Test execution failed: ${errorMessage}`);
      
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: errorMessage,
        duration: Date.now() - startTime,
        testsPassed: 0,
        testsFailed: 1,
        testsTotal: 1
      };
    }
  }

  /**
   * Validate test configuration for security
   */
  private validateTestConfig(config: TestConfig): void {
    // Validate command - only allow safe test commands
    const allowedCommands = ['node', 'npm', 'yarn', 'pnpm', 'deno', 'bun'];
    if (!allowedCommands.includes(config.command)) {
      throw new Error(`Test command not allowed: ${config.command}`);
    }

    // Validate arguments - prevent command injection
    for (const arg of config.args) {
      if (typeof arg !== 'string') {
        throw new Error('Test arguments must be strings');
      }
      
      // Check for dangerous patterns
      const dangerousPatterns = [
        /[;&|`$()]/,  // Command injection characters
        /\.\.\//,     // Path traversal
        /^-/          // Prevent flag injection (args should be file paths)
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(arg)) {
          throw new Error(`Dangerous pattern detected in test argument: ${arg}`);
        }
      }
    }

    // Validate working directory
    if (!config.workingDirectory.startsWith(process.cwd())) {
      throw new Error('Test working directory must be within project directory');
    }

    // Validate timeout
    if (config.timeout < 1000 || config.timeout > 300000) { // 1s to 5min
      throw new Error('Test timeout must be between 1 second and 5 minutes');
    }
  }

  /**
   * Execute tests using child process
   */
  private executeTests(config: TestConfig): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }> {
    return new Promise((resolve, reject) => {
      const options: SpawnOptions = {
        cwd: config.workingDirectory,
        env: config.environment,
        stdio: ['pipe', 'pipe', 'pipe']
      };

      const child = spawn(config.command, config.args, options);
      
      let stdout = '';
      let stderr = '';
      
      // Collect output
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Handle completion
      child.on('close', (code) => {
        resolve({
          exitCode: code || 0,
          stdout,
          stderr
        });
      });
      
      // Handle errors
      child.on('error', (error) => {
        reject(new Error(`Test process error: ${error.message}`));
      });
      
      // Set timeout
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Test execution timed out after ${config.timeout}ms`));
      }, config.timeout);
      
      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Parse test output to extract results
   */
  private parseTestOutput(
    result: { exitCode: number; stdout: string; stderr: string },
    startTime: number
  ): TestResult {
    const duration = Date.now() - startTime;
    const success = result.exitCode === 0;
    
    // Parse test counts from output
    let testsPassed = 0;
    let testsFailed = 0;
    let testsTotal = 0;

    // Try to parse common test output patterns
    const output = result.stdout + result.stderr;
    
    // Pattern for "✅ Passed: X" and "❌ Failed: Y"
    const passedMatch = output.match(/✅\s*Passed:\s*(\d+)/i);
    const failedMatch = output.match(/❌\s*Failed:\s*(\d+)/i);
    const totalMatch = output.match(/📈\s*Total:\s*(\d+)/i);
    
    if (passedMatch) testsPassed = parseInt(passedMatch[1], 10);
    if (failedMatch) testsFailed = parseInt(failedMatch[1], 10);
    if (totalMatch) testsTotal = parseInt(totalMatch[1], 10);
    
    // If no specific counts found, infer from exit code
    if (testsTotal === 0) {
      testsTotal = 1;
      if (success) {
        testsPassed = 1;
        testsFailed = 0;
      } else {
        testsPassed = 0;
        testsFailed = 1;
      }
    }

    return {
      success,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      duration,
      testsPassed,
      testsFailed,
      testsTotal
    };
  }

  /**
   * Log test results
   */
  private logTestResults(result: TestResult): void {
    const passRate = result.testsTotal > 0 ? (result.testsPassed / result.testsTotal) * 100 : 0;
    
    logger.info(`Test execution completed in ${result.duration}ms`);
    logger.info(`Tests: ${result.testsPassed} passed, ${result.testsFailed} failed, ${result.testsTotal} total`);
    logger.info(`Pass rate: ${passRate.toFixed(1)}%`);
    
    if (result.success) {
      logger.info('✅ All tests passed successfully');
    } else {
      logger.warn('❌ Some tests failed');
      if (result.stderr) {
        logger.error('Test errors:', undefined, { stderr: result.stderr });
      }
    }
  }

  /**
   * Verify test results meet requirements
   */
  verifyTestResults(result: TestResult): {
    isValid: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check minimum pass rate
    const passRate = result.testsTotal > 0 ? result.testsPassed / result.testsTotal : 0;
    if (passRate < this.verificationRequirements.minimumPassRate) {
      violations.push(
        `Pass rate ${(passRate * 100).toFixed(1)}% below required ${(this.verificationRequirements.minimumPassRate * 100).toFixed(1)}%`
      );
      recommendations.push('Fix failing tests before marking task as completed');
    }

    // Check for critical test failures
    if (result.testsFailed > 0) {
      violations.push(`${result.testsFailed} test(s) failed`);
      recommendations.push('Review test output and fix failing tests');
    }

    // Check exit code
    if (result.exitCode !== 0) {
      violations.push(`Test process exited with code ${result.exitCode}`);
      recommendations.push('Check test configuration and dependencies');
    }

    const isValid = violations.length === 0;

    logger.debug(`Test verification result: ${isValid ? 'PASSED' : 'FAILED'}`);
    if (violations.length > 0) {
      logger.debug('Violations:', { violations });
    }

    return {
      isValid,
      violations,
      recommendations
    };
  }

  /**
   * Run comprehensive test suite
   */
  async runComprehensiveTests(): Promise<{
    overallResult: TestResult;
    individualResults: { [testFile: string]: TestResult };
    verification: {
      isValid: boolean;
      violations: string[];
      recommendations: string[];
    };
  }> {
    logger.info('Starting comprehensive test suite execution');

    const individualResults: { [testFile: string]: TestResult } = {};
    let overallPassed = 0;
    let overallFailed = 0;
    let overallTotal = 0;
    let overallSuccess = true;

    // Run mandatory tests
    for (const testFile of this.verificationRequirements.mandatoryTests) {
      try {
        const result = await this.runTests({
          args: [testFile.startsWith('test/') ? testFile : `test/${testFile}`]
        });
        
        individualResults[testFile] = result;
        overallPassed += result.testsPassed;
        overallFailed += result.testsFailed;
        overallTotal += result.testsTotal;
        
        if (!result.success) {
          overallSuccess = false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to run test ${testFile}: ${errorMessage}`);
        overallSuccess = false;
        overallFailed += 1;
        overallTotal += 1;
      }
    }

    // Create overall result
    const overallResult: TestResult = {
      success: overallSuccess,
      exitCode: overallSuccess ? 0 : 1,
      stdout: Object.values(individualResults).map(r => r.stdout).join('\n'),
      stderr: Object.values(individualResults).map(r => r.stderr).join('\n'),
      duration: Object.values(individualResults).reduce((sum, r) => sum + r.duration, 0),
      testsPassed: overallPassed,
      testsFailed: overallFailed,
      testsTotal: overallTotal
    };

    // Verify results
    const verification = this.verifyTestResults(overallResult);

    logger.info(`Comprehensive test suite completed: ${overallSuccess ? 'PASSED' : 'FAILED'}`);

    return {
      overallResult,
      individualResults,
      verification
    };
  }

  /**
   * Detect test framework from package.json and project structure
   */
  private async detectTestFramework(): Promise<TestFrameworkConfig | null> {
    try {
      // Read package.json to detect test framework
      const fs = await import('fs/promises');
      const packageJsonPath = `${process.cwd()}/package.json`;
      
      try {
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        
        // Check dependencies for test frameworks
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };
        
        // Jest detection
        if (allDeps.jest || packageJson.jest) {
          return {
            framework: 'jest',
            testPattern: '**/*.{test,spec}.{js,ts}',
            configFile: packageJson.jest ? undefined : 'jest.config.js',
            coverage: true,
            command: 'npm',
            args: ['test']
          };
        }
        
        // Mocha detection
        if (allDeps.mocha) {
          return {
            framework: 'mocha',
            testPattern: 'test/**/*.{test,spec}.{js,ts}',
            configFile: '.mocharc.json',
            coverage: allDeps.nyc || allDeps.c8,
            command: 'npm',
            args: ['test']
          };
        }
        
        // Vitest detection
        if (allDeps.vitest) {
          return {
            framework: 'vitest',
            testPattern: '**/*.{test,spec}.{js,ts}',
            configFile: 'vitest.config.ts',
            coverage: true,
            command: 'npm',
            args: ['test']
          };
        }
        
        // Check for npm test script
        if (packageJson.scripts?.test) {
          return {
            framework: 'npm',
            testPattern: '**/*.{test,spec}.{js,ts}',
            coverage: false,
            command: 'npm',
            args: ['test']
          };
        }
        
      } catch (error) {
        logger.debug('Could not read package.json for framework detection');
      }
      
      return null;
    } catch (error) {
      logger.debug('Framework detection failed:', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  /**
   * Discover and classify test files
   */
  private async discoverTests(): Promise<TestSuite> {
    const testSuite: TestSuite = {
      unitTests: [],
      integrationTests: [],
      e2eTests: [],
      securityTests: []
    };

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Scan test directory
      const testDir = `${process.cwd()}/test`;
      try {
        const testFiles = await fs.readdir(testDir);
        
        for (const file of testFiles) {
          const filePath = path.join(testDir, file);
          const stat = await fs.stat(filePath);
          
          if (stat.isFile() && file.endsWith('.js')) {
            // Classify based on filename patterns
            if (file.includes('integration') || file.includes('mcp-tools')) {
              testSuite.integrationTests.push(file);
            } else if (file.includes('security')) {
              testSuite.securityTests.push(file);
            } else if (file.includes('e2e') || file.includes('end-to-end')) {
              testSuite.e2eTests.push(file);
            } else {
              // Default to integration for existing test structure
              testSuite.integrationTests.push(file);
            }
          }
        }
      } catch (error) {
        logger.debug('Could not scan test directory');
      }
      
      // Scan src directory for unit tests
      const srcDir = `${process.cwd()}/src`;
      try {
        await this.scanDirectoryForUnitTests(srcDir, testSuite.unitTests);
      } catch (error) {
        logger.debug('Could not scan src directory for unit tests');
      }
      
    } catch (error) {
      logger.debug('Test discovery failed:', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    return testSuite;
  }

  /**
   * Recursively scan directory for unit test files
   */
  private async scanDirectoryForUnitTests(dir: string, unitTests: string[]): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          await this.scanDirectoryForUnitTests(fullPath, unitTests);
        } else if (entry.isFile()) {
          // Check for unit test patterns
          if (entry.name.match(/\.(test|spec)\.(ts|js)$/)) {
            unitTests.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
      logger.debug(`Could not scan directory ${dir}`);
    }
  }

  /**
   * Parse coverage output from test results
   */
  private parseCoverageOutput(output: string): CoverageResult | undefined {
    try {
      // Try to parse Jest/Istanbul coverage format
      const coverageMatch = output.match(/All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);
      
      if (coverageMatch) {
        const [, statements, branches, functions, lines] = coverageMatch;
        return {
          statements: { total: 100, covered: parseFloat(statements), percentage: parseFloat(statements) },
          branches: { total: 100, covered: parseFloat(branches), percentage: parseFloat(branches) },
          functions: { total: 100, covered: parseFloat(functions), percentage: parseFloat(functions) },
          lines: { total: 100, covered: parseFloat(lines), percentage: parseFloat(lines) },
          overall: parseFloat(statements)
        };
      }
      
      // Try to parse simple coverage percentage
      const simpleMatch = output.match(/coverage:\s*([\d.]+)%/i);
      if (simpleMatch) {
        const coverage = parseFloat(simpleMatch[1]);
        return {
          statements: { total: 100, covered: coverage, percentage: coverage },
          branches: { total: 100, covered: coverage, percentage: coverage },
          functions: { total: 100, covered: coverage, percentage: coverage },
          lines: { total: 100, covered: coverage, percentage: coverage },
          overall: coverage
        };
      }
      
    } catch (error) {
      logger.debug('Could not parse coverage output');
    }
    
    return undefined;
  }

  /**
   * Run unit tests with coverage
   */
  async runUnitTests(): Promise<{ result: TestResult; coverage?: CoverageResult }> {
    logger.info('Running unit tests with coverage');
    
    const framework = await this.detectTestFramework();
    const testSuite = await this.discoverTests();
    
    if (testSuite.unitTests.length === 0) {
      logger.info('No unit tests found, skipping unit test execution');
      return {
        result: {
          success: true,
          exitCode: 0,
          stdout: 'No unit tests found',
          stderr: '',
          duration: 0,
          testsPassed: 0,
          testsFailed: 0,
          testsTotal: 0
        }
      };
    }
    
    // Configure test execution for unit tests
    const config: Partial<TestConfig> = {
      timeout: 30000, // Shorter timeout for unit tests
      environment: {
        ...process.env,
        NODE_ENV: 'test',
        COVERAGE: 'true'
      }
    };
    
    if (framework) {
      config.command = framework.command;
      config.args = framework.coverage ? [...framework.args, '--coverage'] : framework.args;
    } else {
      // Fallback to running individual unit test files
      config.command = 'node';
      config.args = testSuite.unitTests.slice(0, 1); // Run first unit test as example
    }
    
    const result = await this.runTests(config);
    const coverage = this.parseCoverageOutput(result.stdout + result.stderr);
    
    return { result, coverage };
  }

  /**
   * Enhanced verification for unit and integration tests
   */
  async verifyEnhancedTestResults(): Promise<EnhancedVerificationResult> {
    logger.info('Running enhanced test verification');
    
    const violations: string[] = [];
    const recommendations: string[] = [];
    
    // Run unit tests
    const unitTestExecution = await this.runUnitTests();
    const unitTestResults = {
      isValid: unitTestExecution.result.success,
      violations: [] as string[],
      coverage: unitTestExecution.coverage
    };
    
    // Verify unit test coverage
    if (unitTestExecution.coverage) {
      if (unitTestExecution.coverage.overall < this.verificationRequirements.minimumUnitCoverage * 100) {
        unitTestResults.violations.push(
          `Unit test coverage ${unitTestExecution.coverage.overall.toFixed(1)}% below required ${(this.verificationRequirements.minimumUnitCoverage * 100).toFixed(1)}%`
        );
        unitTestResults.isValid = false;
      }
    } else if (unitTestExecution.result.testsTotal > 0) {
      unitTestResults.violations.push('Unit test coverage information not available');
      recommendations.push('Configure coverage reporting for unit tests');
    }
    
    // Run integration tests
    const integrationTestExecution = await this.runComprehensiveTests();
    const integrationTestResults = {
      isValid: integrationTestExecution.verification.isValid,
      violations: integrationTestExecution.verification.violations
    };
    
    // Combine results
    const allViolations = [
      ...unitTestResults.violations,
      ...integrationTestResults.violations
    ];
    
    const isValid = unitTestResults.isValid && integrationTestResults.isValid;
    
    if (!isValid) {
      violations.push(...allViolations);
      recommendations.push('Fix all test failures and coverage issues before task completion');
    }
    
    return {
      isValid,
      violations,
      recommendations,
      unitTestResults,
      integrationTestResults
    };
  }

  /**
   * Generate enhanced test verification instructions for agent
   */
  generateEnhancedTestInstructions(): {
    testingRequired: boolean;
    unitTestCommands: string[];
    integrationTestCommands: string[];
    verificationSteps: string[];
    blockingIssues: string[];
    coverageRequired: boolean;
  } {
    return {
      testingRequired: true,
      unitTestCommands: [
        'npm test -- --coverage',
        'npm run test:unit'
      ],
      integrationTestCommands: [
        'node test/test-mcp-tools-integration.js',
        'node test/security-validation-test.js'
      ],
      verificationSteps: [
        'Execute unit tests with coverage reporting',
        'Verify 80% or higher unit test coverage',
        'Execute integration tests',
        'Verify 90% or higher integration test pass rate',
        'Ensure no critical test failures',
        'Check test output for errors'
      ],
      blockingIssues: [],
      coverageRequired: true
    };
  }

  /**
   * Generate test verification instructions for agent (legacy method)
   */
  generateTestInstructions(testResult?: TestResult): {
    testingRequired: boolean;
    testCommands: string[];
    verificationSteps: string[];
    blockingIssues: string[];
  } {
    const instructions = {
      testingRequired: true,
      testCommands: [
        'node test/test-mcp-tools-integration.js',
        'node test/security-validation-test.js'
      ],
      verificationSteps: [
        'Execute all mandatory tests',
        'Verify 90% or higher pass rate',
        'Ensure no critical test failures',
        'Check test output for errors'
      ],
      blockingIssues: [] as string[]
    };

    if (testResult) {
      const verification = this.verifyTestResults(testResult);
      if (!verification.isValid) {
        instructions.blockingIssues = verification.violations;
      }
    }

    return instructions;
  }
}

/**
 * Convenience function to run tests
 */
export async function runTests(config?: Partial<TestConfig>): Promise<TestResult> {
  return TestRunner.getInstance().runTests(config);
}

/**
 * Convenience function to run comprehensive tests
 */
export async function runComprehensiveTests() {
  return TestRunner.getInstance().runComprehensiveTests();
}

/**
 * Convenience function to verify test results
 */
export function verifyTestResults(result: TestResult) {
  return TestRunner.getInstance().verifyTestResults(result);
}

/**
 * Convenience function to generate test instructions
 */
export function generateTestInstructions(testResult?: TestResult) {
  return TestRunner.getInstance().generateTestInstructions(testResult);
}
