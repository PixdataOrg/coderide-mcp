module.exports = {
  name: 'coderide-mcp',
  stack: {
    framework: {
      name: 'unknown',
      version: "",
      variant: ""
    },
    packageManager: 'npm',
    testing: {
      unit: 'none',
      e2e: 'none'
    },
    styling: 'css'
  },
  commands: {
    dev: 'npm run dev',
    build: 'npm run build',
    test: 'npm test',
    lint: 'npm run lint',
    typecheck: 'npx tsc --noEmit'
  },
  paths: {
    root: '.ralph',
    prompts: '.ralph/prompts',
    guides: '.ralph/guides',
    specs: '.ralph/specs',
    scripts: '.ralph/scripts',
    learnings: '.ralph/LEARNINGS.md',
    agents: '.ralph/AGENTS.md'
  },
  loop: {
    maxIterations: 10,
    maxE2eAttempts: 5,
    defaultModel: 'sonnet',
    planningModel: 'opus'
  }
};
