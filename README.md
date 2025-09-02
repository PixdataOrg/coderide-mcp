# Supercharge Your AI Assistant or IDE with CodeRide Task Management

[![npm version](https://img.shields.io/npm/v/@coderide/mcp.svg)](https://www.npmjs.com/package/@coderide/mcp)
[![smithery badge](https://smithery.ai/badge/@PixdataOrg/coderide)](https://smithery.ai/server/@PixdataOrg/coderide)

<a href="https://glama.ai/mcp/servers/@PixdataOrg/coderide-mcp">
  <img width="300" height="157" src="https://glama.ai/mcp/servers/@PixdataOrg/coderide-mcp/badge" alt="coderide MCP server" />
</a>

<p align="center">
  <a href="https://coderide.ai" target="_blank">
    <img src="https://ideybnueizkxwqmjowpy.supabase.co/storage/v1/object/sign/coderide-website/Coderide-og-Facebook.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2M5OWNmMjY4LTg5MTMtNGFiOS1iYjhhLTIxMTUyNDZjNGM2NCJ9.eyJ1cmwiOiJjb2RlcmlkZS13ZWJzaXRlL0NvZGVyaWRlLW9nLUZhY2Vib29rLmpwZyIsImlhdCI6MTc0ODM3ODg1MiwiZXhwIjoxNzc5OTE0ODUyfQ.jBb-x5f2MACBNBsls0u_9seYIiynektHqef2Y_vSMHQ" alt="CodeRide" width="100%"/>
  </a>
</p>

<!-- Suggestion: Add badges here: npm version, license, build status, etc. -->

**Give your AI coding sidekick the power of CodeRide!** CodeRide MCP connects your favorite AI development tools (like Cursor, Cline, Windsurf, and other MCP clients) directly to CodeRide, the AI-native task management system.

Imagine your AI not just writing code, but truly understanding project context, managing its own tasks, and collaborating seamlessly with you. No more endless copy-pasting or manual updates. With CodeRide MCP, your AI becomes a first-class citizen in your CodeRide workflow.

## 🚀 Why CodeRide MCP is a Game-Changer

*   **Deep Project Understanding for Your AI:** Equip your AI agents with rich, structured context from your CodeRide projects and tasks. Let them see the bigger picture.
*   **Seamless AI-Powered Task Automation:** Empower AIs to fetch, interpret, and update tasks directly in CodeRide, automating routine project management.
*   **Bridge the Gap Between Human & AI Developers:** Foster true collaboration with smoother handoffs, consistent task understanding, and aligned efforts.
*   **Optimized for LLM Efficiency:** Compact JSON responses minimize token usage, ensuring faster, more cost-effective AI interactions.
*   **Secure by Design:** Workspace-scoped API key authentication ensures your data's integrity and that AI operations are confined to the correct project context.
*   **Plug & Play Integration:** Effortlessly set up with `npx` in any MCP-compatible environment. Get your AI connected in minutes!
*   **Future-Proof Your Workflow:** Embrace an AI-native approach to development, built on the open Model Context Protocol standard.

## ✨ Core Capabilities

The CodeRide MCP server provides your AI with the following capabilities:

*   **Task Management:** Fetch specific tasks, list all tasks in a project, and get the next task in sequence.
*   **Task Updates:** Modify task descriptions and statuses.
*   **Prompt Access:** Get tailored prompts and instructions for specific tasks.
*   **Project Management:** List all projects, retrieve project details, and manage project knowledge.
*   **Project Knowledge Management:** Update a project's knowledge graph and architecture diagrams.
*   **Project Initiation:** Get the first task of a project to kickstart work.
*   **Workflow Automation:** Navigate through task sequences with smart next-task suggestions.

## ⚙️ Getting Started

### Installing via Smithery (Recommended)

To install Coderide MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@PixdataOrg/coderide):

```bash
npx -y @smithery/cli install @PixdataOrg/coderide --client claude
```

### Smithery Deployment Modes

CodeRide MCP supports **dual-mode operation** for both development and production use:

#### 🔧 **Development/Testing Mode (Mock)**
Perfect for exploring features, testing integrations, or contributing to the project without needing a real CodeRide account.

**How to activate:** In the Smithery playground or configuration, either:
- Leave the `CODERIDE_API_KEY` field empty
- Provide any placeholder value (e.g., `mock-key`, `test`, etc.)

**What you get:**
- All 9 tools available with realistic mock data
- Sample projects (ABC, XYZ) and tasks (ABC-1, ABC-2, etc.)
- Full MCP functionality for testing and development
- No real API calls - completely safe for experimentation

#### 🚀 **Production Mode (Real API)**
For actual CodeRide users who want to integrate with their real projects and tasks.

**How to activate:** Provide a valid CodeRide API key that starts with `CR_API_KEY_`

**What you get:**
- Full integration with your CodeRide workspace
- Real project and task data
- Ability to update tasks and projects
- Complete workflow automation

### Traditional MCP Configuration

For non-Smithery deployments, add this configuration to your MCP client:

```json
{
  "mcpServers": {
    "coderide": {
      "command": "npx",
      "args": ["-y", "@coderide/mcp"],
      "env": {
        "CODERIDE_API_KEY": "YOUR_CODERIDE_API_KEY_HERE"
      }
    }
  }
}
```

**Prerequisites:**

1.  **Node.js and npm:** Ensure you have Node.js (which includes npm) installed.
2.  **CodeRide Account & API Key (Production only):** For production use, you'll need an active CodeRide account and API key from [app.coderide.ai](https://app.coderide.ai).

Once configured, your MCP client will automatically connect to the CodeRide MCP server with the appropriate mode based on your configuration.

## 🤖 Who is this for?

CodeRide MCP is for:

*   **Developers using AI coding assistants:** Integrate your AI tools (Cursor, Cline, Windsurf, etc.) deeply with your CodeRide task management.
*   **Teams adopting AI-driven development:** Standardize how AI agents access project information and contribute to tasks.
*   **Anyone building with MCP:** Leverage a powerful example of an MCP server that connects to a real-world SaaS platform.

If you're looking to make your AI assistant a more productive and integrated member of your development team, CodeRide MCP is for you.

## 🔨 Available Tools

Here's a breakdown of the tools provided by CodeRide MCP and how they can be used:

### `get_task`

Retrieves detailed information about a specific task by its number (e.g., "TCA-3").

**Input Schema:**
```json
{
  "number": "task-number (e.g., 'TCA-3')",
  "status": "to-do|in-progress|completed", // Optional: filter by status
}
```

**Example Use Case:**
*   **User Prompt:** "Hey AI, what are the details for task APP-101?"
*   **AI Action:** Calls `get_task` with `arguments: { "number": "APP-101" }`.
*   **Outcome:** AI receives the title, description, status, priority, and other context for task APP-101.

### `update_task`

Updates an existing task's description, status, or other mutable fields.

**Input Schema:**
```json
{
  "number": "task-number-identifier",
  "description": "updated-task-description", // Optional
  "status": "to-do|in-progress|completed"   // Optional
}
```

**Example Use Case:**
*   **User Prompt:** "AI, please mark task BUG-42 as 'completed' and add a note: 'Fixed the off-by-one error.'"
*   **AI Action:** Calls `update_task` with `arguments: { "number": "BUG-42", "status": "completed", "description": "Fixed the off-by-one error." }`.
*   **Outcome:** Task BUG-42 is updated in CodeRide.

### `get_prompt`

Retrieves the specific prompt or instructions tailored for an AI agent to work on a given task.

**Input Schema:**
```json
{
  "number": "task-number (e.g., 'TCA-3')"
}
```

**Example Use Case:**
*   **User Prompt:** "AI, I'm ready to start on task ETF-7. What's the main objective?"
*   **AI Action:** Calls `get_prompt` with `arguments: { "slug": "ETF", "number": "ETF-7" }`.
*   **Outcome:** AI receives the specific, actionable prompt for FEAT-7, enabling it to begin work with clear direction.

### `get_project`

Retrieves details about a specific project using its slug.

**Input Schema:**
```json
{
  "slug": "project-slug (e.g., 'TCA')",
  "name": "optional-project-name" // Can also retrieve by name
}
```

**Example Use Case:**
*   **User Prompt:** "AI, can you give me an overview of the 'Omega Initiative' project?"
*   **AI Action:** Calls `get_project` with `arguments: { "slug": "omega-initiative" }`.
*   **Outcome:** AI receives the project's name, description, and potentially links to its knowledge base or diagrams.

### `update_project`

Updates a project's high-level information, such as its knowledge graph or system architecture diagram.

**Input Schema:**
```json
{
  "slug": "project-slug-identifier",
  "project_knowledge": { /* JSON object representing the knowledge graph */ }, // Optional
  "project_diagram": "/* Mermaid diagram string or similar */"             // Optional
}
```

**Example Use Case:**
*   **User Prompt:** "AI, I've updated the user authentication flow. Please update the project diagram for project 'APB'."
*   **AI Action:** (After generating/receiving the new diagram) Calls `update_project` with `arguments: { "slug": "APB", "project_diagram": "/* new mermaid diagram */" }`.
*   **Outcome:** The 'AlphaProject' in CodeRide now has the updated architecture diagram.

### `start_project`

Retrieves the first or next recommended task for a given project, allowing an AI to begin work.

**Input Schema:**
```json
{
  "slug": "project-slug (e.g., 'TCA')"
}
```

**Example Use Case:**
*   **User Prompt:** "AI, let's get started on the 'MobileAppV2' project. What's the first task?"
*   **AI Action:** Calls `start_project` with `arguments: { "slug": "MBC" }`.
*   **Outcome:** AI receives details for the initial task in the 'MBC' project, ready to begin.

### `list_projects` ✨ NEW

Lists all projects in the user's workspace, providing an overview of available projects with intelligent workflow guidance.

**Input Schema:**
```json
{
  // No input required - automatically uses workspace from API key
}
```

**Example Use Case:**
*   **User Prompt:** "AI, show me all my projects."
*   **AI Action:** Calls `list_projects` with no arguments.
*   **Outcome:** AI receives a list of all projects in the workspace with their slugs, names, and basic details, plus intelligent guidance for project selection and workflow initiation.

### `list_tasks` ✨ NEW

Shows all tasks within a specific project, organized by status with smart numerical sorting and workflow optimization.

**Input Schema:**
```json
{
  "slug": "project-slug (e.g., 'CRD')"
}
```

**Example Use Case:**
*   **User Prompt:** "AI, what tasks are available in the CRD project?"
*   **AI Action:** Calls `list_tasks` with `arguments: { "slug": "CRD" }`.
*   **Outcome:** AI receives all tasks in the CRD project, sorted numerically (CRD-1, CRD-2, CRD-3...) and organized by status columns, with intelligent task selection guidance.

### `next_task` ✨ NEW

Retrieves the next task in sequence for workflow automation, perfect for continuous development flows with intelligent sequencing.

**Input Schema:**
```json
{
  "number": "current-task-number (e.g., 'CRD-1')"
}
```

**Example Use Case:**
*   **User Prompt:** "AI, I just finished CRD-1. What's next?"
*   **AI Action:** Calls `next_task` with `arguments: { "number": "CRD-1" }`.
*   **Outcome:** AI receives details for CRD-2, enabling seamless workflow continuation with prerequisite validation and contextual guidance.

## 💡 Technical Highlights

*   **🧠 AI-Native Workflow Optimization:** Advanced agent instruction system with MCP 2025 structured tool output and intelligent workflow orchestration for enhanced AI productivity.
*   **🔄 Intelligent Task Sequencing:** Prerequisite validation, status-aware guidance, and automated workflow phases (Discovery → Context → Analysis → Implementation → Completion).
*   **Security-First Design:** Comprehensive input validation, secure API client with retry logic, and workspace-scoped authentication ensure data integrity and safe AI operations.
*   **Production-Ready Reliability:** Exponential backoff retry mechanisms, 90-second timeouts, and stable MCP SDK version (^1.0.3) provide enterprise-grade stability.
*   **Workspace-Centered Authentication:** API keys are tied to specific workspaces. All operations are automatically scoped, simplifying requests and enhancing security. No need to pass `workspaceId`!
*   **User-Friendly Identifiers:** Interact with tasks and projects using human-readable numbers (e.g., "TCA-3") and slugs (e.g., "TCA") instead of internal UUIDs.
*   **Optimized for AI Efficiency:** Compact JSON responses minimize token usage, while smart error handling prevents unnecessary retries on validation errors.
*   **Robust API Interaction:** Uses the official CodeRide API (`https://api.coderide.ai` by default) with comprehensive logging and error handling for all operations.

## 🛡️ Security

CodeRide MCP takes security seriously. We welcome responsible security research and have established a comprehensive bug bounty program with rewards ranging from €9 to €119.

For security vulnerabilities, please see our [Security Policy](SECURITY.md) for reporting guidelines and reward information.

## 🔧 Recent Improvements

### v0.9.0 - Comprehensive Agent Workflow Enhancement 🚀
- **🧠 NLP Recognition System**: Smart detection of project references and user intent in natural language for improved agent understanding
- **🧪 Mandatory Testing Verification**: Comprehensive testing pipeline with unit + integration test support, coverage validation (80% unit, 90% integration)
- **📝 Automatic Git Commits**: Full Conventional Commits 1.0.0 compliance with semantic versioning and automated commit generation
- **🎯 Project Knowledge Optimization**: Intelligent project knowledge management with consistency validation and standardized schemas
- **⚡ Enhanced Agent Instructions**: MCP 2025 structured tool output with workflow intelligence and phase-based guidance
- **🔒 Security & Performance**: Input validation, command injection prevention, singleton patterns, and comprehensive error handling
- **🔄 Complete Workflow Automation**: Discovery → Context → Analysis → Implementation → Completion phases with intelligent sequencing

### v0.8.0 - Agent Workflow Optimization
- **🧠 Intelligent Agent Instructions**: Implemented comprehensive agent instruction system with MCP 2025 structured tool output
- **🔄 Workflow Orchestration**: Added prerequisite validation, status-aware guidance, and automated workflow phases
- **📁 Enhanced Tool Organization**: Renamed tools for consistency (`project_list` → `list_projects`, `task_list` → `list_tasks`)
- **⚡ AI Productivity Boost**: All 9 tools now include contextual guidance, automation hints, and workflow intelligence
- **🔒 Maintained Compatibility**: 100% backward compatibility with existing integrations and security systems

### Previous Improvements
- **Enhanced Reliability**: Implemented exponential backoff retry logic for improved connection stability
- **Optimized Timeouts**: Increased API timeouts to 90 seconds for better handling of complex operations
- **Stable Dependencies**: Pinned MCP SDK to stable version (^1.0.3) for consistent behavior
- **MCP Protocol Optimizations**: Reduced timeout errors (-32001) and SSE stream disconnections

## 🔥 About CodeRide

**CodeRide is where AI and human developers unite to build better software, faster.**

It's more than just task management; it's an AI-native platform built from the ground up to support the unique workflows of AI-assisted software development. CodeRide provides the essential structured context, project knowledge, and external memory that AI agents require to understand complex projects, contribute meaningfully, and collaborate effectively with their human counterparts.

Transform your development process with a tool that truly understands the synergy between human ingenuity and artificial intelligence.

Discover the future of software development at [coderide.ai](https://coderide.ai).

## 🔧 Troubleshooting

### Common Issues

**Connection Timeouts or MCP Error -32001:**
- The recent improvements have significantly reduced these issues
- Ensure you're using the latest version: `npx -y @coderide/mcp@latest`
- Check your API key is correctly set in the environment configuration

**Authentication Errors:**
- Verify your CodeRide API key is valid and has the correct permissions
- Ensure the API key is properly set in your MCP client configuration
- API keys are workspace-scoped - make sure you're using the right workspace

**Tool Not Found Errors:**
- Restart your MCP client after configuration changes
- Verify the server is properly configured in your MCP client settings

For additional support, please [open an issue](https://github.com/PixdataOrg/coderide-mcp/issues) with detailed error information.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, fork the repository, and create pull requests.

For security-related contributions, please see our [Security Policy](SECURITY.md).

## 🔖 License

All rights reserved. See the [LICENSE](LICENSE) file for details.

## 🤗 Support & Community

*   Have questions or need help with `@coderide/mcp`? [Open an issue](https://github.com/PixdataOrg/coderide-mcp/issues) on our GitHub repository.
*   Want to learn more about CodeRide? Visit [coderide.ai](https://coderide.ai) or join our community (Link to community forum/Discord if available).
