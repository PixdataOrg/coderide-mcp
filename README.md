# CodeRide MCP v0.2.0

A Model Context Protocol (MCP) server implementation that bridges AI coding agents with the CodeRide task management system. This integration addresses the inherent limitations of AI systems by providing structured context, external memory, and standardized communication channels between human developers and AI assistants.

CodeRide MCP enables AI agents to:
- Retrieve and manage tasks with context-optimized structures
- Access relevant code snippets and documentation within token limits
- Maintain state across interactions through the external memory system
- Follow clear task boundaries and permission controls
- Provide confidence-scored responses for better human oversight

This implementation serves as the communication layer for CodeRide, allowing AI coding assistants to work effectively within complex project structures despite their context window limitations and state management challenges.

## Features

- **get_task**: Retrieve tasks by task number with workspace-scoped authentication
- **update_task**: Update task descriptions and status using task numbers
- **get_prompt**: Get task prompts and instructions for AI agents
- **get_project**: Find projects by slug within the authenticated workspace
- **update_project**: Update project knowledge graph and structure diagram
- **start_project**: Get the first task of a project to begin work
- **Compact JSON**: All responses use compact JSON format to minimize token usage

## Technical Stack

- **TypeScript**: Type-safe implementation
- **Node.js**: Runtime environment
- **MCP SDK**: Protocol handling for AI agent communication
- **Zod**: Schema validation for tool inputs
- **Axios**: HTTP communication with CodeRide API
- **CodeRide API**: Backend task management service

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PixdataOrg/coderide-mcp
   cd coderide-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your CodeRide API credentials:
   ```
   CODERIDE_API_URL=http://localhost:1337
   CODERIDE_API_KEY=your_api_key_here
   ```

## Building and Running

1. Build the project:
   ```bash
   npm run build
   ```

2. Run the server:
   ```bash
   npm start
   ```

For development with auto-restart:
```bash
npm run dev
```

## MCP Integration

To use this server with AI coding agents, add it to your MCP configuration:

```json
{
  "mcpServers": {
    "coderide": {
      "command": "node",
      "args": ["/path/to/coderide-mcp/dist/index.js"],
      "env": {
        "CODERIDE_API_URL": "http://localhost:1337",
        "CODERIDE_API_KEY": "your_api_key_here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## MCP Inspector

The MCP Inspector is a tool provided by the Model Context Protocol that allows you to test and interact with the CodeRide MCP server. It provides a user-friendly interface to:

- Inspect available tools and their schemas
- Test tool calls with different parameters
- View responses and debug issues

### Running the MCP Inspector

We provide a simple script to run the MCP Inspector with the correct settings:

```bash
node test/run-mcp-inspector.js
```

This will:
- Create a temporary settings file
- Install and run the MCP Inspector
- Connect to the CodeRide MCP server
- Clean up when you exit

For more detailed information about using the MCP Inspector with CodeRide, see the [MCP Inspector documentation](docs/mcp-inspector.md).

## Available Tools

### get_task

Retrieves tasks by task number within the authenticated workspace.

**Input Schema:**
```json
{
  "number": "task-number (e.g., 'TCA-3')",
  "status": "to-do|in-progress|completed",
  "agent": "optional-agent-identifier",
  "limit": 10,
  "offset": 0
}
```

### update_task

Updates an existing task's description and/or status.

**Input Schema:**
```json
{
  "number": "task-number-identifier",
  "description": "updated-task-description",
  "status": "to-do|in-progress|completed"
}
```

### get_prompt

Retrieves task prompt and instructions for AI agents.

**Input Schema:**
```json
{
  "slug": "project-slug (e.g., 'TCA')",
  "number": "task-number (e.g., 'TCA-3')"
}
```

### get_project

Retrieves project details by slug within the authenticated workspace.

**Input Schema:**
```json
{
  "slug": "project-slug",
  "name": "optional-project-name",
  "description": "optional-search-text"
}
```

### update_project

Updates a project's knowledge graph and structure diagram.

**Input Schema:**
```json
{
  "slug": "project-slug-identifier",
  "project_knowledge": {
    "key": "value",
    "nested": {
      "data": "structure"
    }
  },
  "project_diagram": "graph TD;\n  A[Component A] --> B[Component B];\n  A --> C[Component C];"
}
```

### start_project

Retrieves the first task of a project to begin work.

**Input Schema:**
```json
{
  "slug": "project-slug (e.g., 'TCA')"
}
```

## Response Format

All responses from the CodeRide MCP server are returned in compact JSON format to minimize token usage when communicating with AI agents. This reduces the context window consumption while preserving all data.

**Example Response:**
```json
{"success":true,"count":1,"tasks":[{"number":"TCA-3","title":"Implement user authentication","description":"Set up user authentication system with login, registration, and session management","status":"in-progress","priority":"high","agent":"backend_specialist"}]}
```

This compact format provides approximately 60-70% reduction in token usage compared to pretty-printed JSON, while maintaining all the original data and structure.

## Workspace-Centered Authentication

Version 0.2.0 introduces workspace-centered authentication where:
- API keys are bound to specific workspaces
- No workspace ID needs to be passed in requests
- All operations are automatically scoped to the authenticated workspace
- Task numbers (e.g., "TCA-3") and project slugs (e.g., "TCA") are used instead of internal UUIDs

This simplifies the integration and ensures proper data isolation between workspaces.

## Data Interaction

The server interacts with the CodeRide API for task and project management. The API endpoints include:
- `/task/number/:taskNumber` - Get/update tasks by number
- `/task/number/:taskNumber/prompt` - Get task prompts
- `/project/slug/:slug` - Get/update projects by slug
- `/project/slug/:slug/first-task` - Get the first task of a project

## License

All rights reserved. See the [LICENSE](LICENSE) file for details.
