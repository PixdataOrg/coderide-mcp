/**
 * Test-1: TypeScript compilation test
 * Verifies that the project builds successfully with all metadata changes
 *
 * This test ensures that:
 * - TypeScript compiles without errors
 * - All metadata types are correctly defined
 * - The build produces expected output files
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('Test-1: TypeScript Compilation\n');
console.log('=' .repeat(50));

// Test 1: Clean build
console.log('\nTest 1.1: Running clean build...');
try {
  // Note: Using execSync with hardcoded commands only (no user input)
  // This is safe as the command is static and not constructed from external data
  execSync('npm run build', {
    cwd: projectRoot,
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  console.log('✓ TypeScript compilation successful');
} catch (error) {
  console.error('✗ TypeScript compilation FAILED');
  console.error(error.stdout);
  console.error(error.stderr);
  process.exit(1);
}

// Test 2: Verify dist directory exists
console.log('\nTest 1.2: Verifying build output...');
const distDir = resolve(projectRoot, 'dist');
if (!existsSync(distDir)) {
  console.error('✗ dist/ directory not found after build');
  process.exit(1);
}
console.log('✓ dist/ directory exists');

// Test 3: Verify key output files exist
const requiredFiles = [
  'dist/index.js',
  'dist/cli.js',
  'dist/utils/base-tool.js',
  'dist/tools/get-task.js',
  'dist/tools/update-task.js',
  'dist/tools/get-project.js',
  'dist/tools/update-project.js',
  'dist/tools/get-prompt.js',
  'dist/tools/start-project.js',
  'dist/tools/list-projects.js',
  'dist/tools/list-tasks.js',
  'dist/tools/next-task.js'
];

console.log('\nTest 1.3: Verifying required output files...');
let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = resolve(projectRoot, file);
  if (!existsSync(filePath)) {
    console.error(`✗ Missing required file: ${file}`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error('\n✗ Some required files are missing');
  process.exit(1);
}
console.log(`✓ All ${requiredFiles.length} required output files exist`);

// Test 4: Verify type checking passes
console.log('\nTest 1.4: Running TypeScript type check...');
try {
  // Note: Using execSync with hardcoded commands only (no user input)
  execSync('npx tsc --noEmit', {
    cwd: projectRoot,
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  console.log('✓ TypeScript type checking passed');
} catch (error) {
  console.error('✗ TypeScript type checking FAILED');
  console.error(error.stdout);
  console.error(error.stderr);
  process.exit(1);
}

// Test 5: Verify metadata types can be imported from compiled code
console.log('\nTest 1.5: Verifying metadata types in compiled code...');
try {
  const { BaseTool } = await import('../dist/utils/base-tool.js');

  // Create a minimal test to ensure types are available
  if (typeof BaseTool !== 'function') {
    throw new Error('BaseTool is not a function');
  }

  console.log('✓ Metadata types available in compiled code');
} catch (error) {
  console.error('✗ Failed to import metadata types from compiled code');
  console.error(error.message);
  process.exit(1);
}

console.log('\n' + '='.repeat(50));
console.log('✓ All compilation tests passed!');
console.log('\nSummary:');
console.log('- TypeScript compilation successful');
console.log('- Build output directory created');
console.log(`- ${requiredFiles.length} required files generated`);
console.log('- Type checking passed');
console.log('- Metadata types available in compiled code');
