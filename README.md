# CodeRide MCP v0.1.0

A Model Context Protocol (MCP) server implementation that bridges AI coding agents with the CodeRide task management system. This integration addresses the inherent limitations of AI systems by providing structured context, external memory, and standardized communication channels between human developers and AI assistants.

CodeRide MCP enables AI agents to:
- Retrieve and manage tasks with context-optimized structures
- Access relevant code snippets and documentation within token limits
- Maintain state across interactions through the external memory system
- Follow clear task boundaries and permission controls
- Provide confidence-scored responses for better human oversight

This implementation serves as the communication layer for CodeRide, allowing AI coding assistants to work effectively within complex project structures despite their context window limitations and state management challenges.

## Features

- **get_project**: Find projects by slug, name, or description
- **get_task**: Retrieve tasks by project slug or task number with status filtering
- **update_task**: Update task descriptions and status
- **update_project**: Update project knowledge graph and structure diagram
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
   CODERIDE_API_URL=http://localhost:3000/api/coderide
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
        "CODERIDE_API_URL": "http://localhost:3000/api/coderide",
        "CODERIDE_API_KEY": "your_api_key_here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Tools

### get_project

Retrieves project details by slug, name, or description.

**Input Schema:**
```json
{
  "workspaceId": "Workspace ID from CodeRide",
  "slug": "optional-project-slug",
  "name": "optional-project-name",
  "description": "optional-search-text"
}
```

### get_task

Retrieves tasks either by project slug or task number.

**Input Schema:**
```json
{
  "workspaceId": "Workspace ID from CodeRide",
  "slug": "project-slug",
  "number": "task-number",
  "status": "to-do|in-progress|completed",
  "agent": "optional-agent-identifier",
  "limit": 10,
  "offset": 0
}
```

**Examples:**
```json
// Get all tasks for a project
{
  "slug": "ABC",
  "status": "to-do",
  "limit": 20
}

// Get a specific task by number
{
  "number": "ABC-1"
}
```

### update_task

Updates an existing task's description and/or status.

**Input Schema:**
```json
{
  "workspaceId": "Workspace ID from CodeRide",
  "number": "task-number-identifier",
  "description": "updated-task-description",
  "status": "to-do|in-progress|completed"
}
```

### update_project

Updates a project's knowledge graph and structure diagram.

**Input Schema:**
```json
{
  "workspaceId": "Workspace ID from CodeRide",
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

## Response Format

All responses from the CodeRide MCP server are returned in compact JSON format to minimize token usage when communicating with AI agents. This reduces the context window consumption while preserving all data.

**Example Response:**
```json
{"success":true,"count":1,"tasks":[{"number":"CFW-2","title":"API Integration","description":"Implement API client and integration, ensuring proper connection with the CodeRide API.","status":"to-do","priority":"high","agent":"backend_specialist","agent_prompt":"You are a Backend Specialist with expertise in API integrations. Your task is to implement the API integration layer for the CodeRide system.","context":{"next_tasks":[{"title":"AI Worker Bindings Setup","number":"CFW-3","status":"to-do"}],"requirements":{"functional":["Connect to CodeRide API","Implement data fetching methods","Create utility functions for API operations"],"non_functional":["Secure credential management","Efficient error handling","Proper type definitions"]},"previous_tasks":[{"title":"Project Setup and Environment Configuration","number":"CFW-1","status":"completed"}],"project_summary":"Implementation of CodeRide API capabilities for CodeRide MCP, featuring a multi-agent architecture"},"instructions":{"steps":["Create an API client utility module","Implement functions to fetch project data from API","Implement functions to fetch and update task data","Create helper functions for task context and instructions","Set up secure environment variables for API credentials","Implement comprehensive error handling for API operations"],"constraints":["Use TypeScript for type safety","Ensure proper error handling and logging"],"next":["after you complete the task, update its status by using coderide","then use coderide to retrieve the next task that needs to be completed"],"checkpoints":["Verify API client connects successfully","Test data fetching from the API","Confirm environment variables are properly secured"],"validation":["Unit tests for all API utility functions","Integration test connecting to the actual API","Verify error handling by testing with invalid credentials","Confirm proper type definitions for all API operations","Test query performance to ensure efficiency"]}}]}
```

This compact format provides approximately 60-70% reduction in token usage compared to pretty-printed JSON, while maintaining all the original data and structure.

## Data Interaction

The server now interacts with the CodeRide API for task and project management, rather than directly with a database. The API endpoints and expected data structures are defined in the CodeRide API documentation (e.g., Postman collection).

## License

All rights reserved. See the [LICENSE](LICENSE) file for details.
