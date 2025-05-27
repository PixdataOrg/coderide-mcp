# Supercharge Your AI Assistant or IDE with CodeRide Task Management

<p align="center">
  <a href="https://coderide.ai" target="_blank">
    <img src="https://ideybnueizkxwqmjowpy.supabase.co/storage/v1/object/sign/coderide-website/Coderide-og-Facebook.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2M5OWNmMjY4LTg5MTMtNGFiOS1iYjhhLTIxMTUyNDZjNGM2NCJ9.eyJ1cmwiOiJjb2RlcmlkZS13ZWJzaXRlL0NvZGVyaWRlLW9nLUZhY2Vib29rLmpwZyIsImlhdCI6MTc0ODM3ODg1MiwiZXhwIjoxNzc5OTE0ODUyfQ.jBb-x5f2MACBNBsls0u_9seYIiynektHqef2Y_vSMHQ" alt="CodeRide" width="600"/>
  </a>
</p>

<!-- Suggestion: Add badges here: npm version, license, build status, etc. -->

**Give your AI coding sidekick the power of CodeRide!** CodeRide MCP connects your favorite AI development tools (like Cursor, Cline, Windsurf, and other MCP clients) directly to CodeRide, the AI-native task management system.

Imagine your AI not just writing code, but truly understanding project context, managing its own tasks, and collaborating seamlessly with you. No more endless copy-pasting or manual updates. With CodeRide MCP, your AI becomes a first-class citizen in your CodeRide workflow.

## Why CodeRide MCP is a Game-Changer

<p align="center">
  <video autoplay loop muted playsinline width="600">
    <source src="https://ideybnueizkxwqmjowpy.supabase.co/storage/v1/object/sign/coderide-website/coderide-code-demo-1_short-169.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2M5OWNmMjY4LTg5MTMtNGFiOS1iYjhhLTIxMTUyNDZjNGM2NCJ9.eyJ1cmwiOiJjb2RlcmlkZS13ZWJzaXRlL2NvZGVyaWRlLWNvZGUtZGVtby0xX3Nob3J0LTE2OS5tcDQiLCJpYXQiOjE3NDgzODAzMDgsImV4cCI6MTc3OTkxNjMwOH0.9j4saX6u1CmXlZiqGMDvhQmacLidjvXSRVTYRr9B7F0" type="video/mp4">
    Your browser does not support the video tag. Click <a href="https://ideybnueizkxwqmjowpy.supabase.co/storage/v1/object/sign/coderide-website/coderide-code-demo-1_short-169.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2M5OWNmMjY4LTg5MTMtNGFiOS1iYjhhLTIxMTUyNDZjNGM2NCJ9.eyJ1cmwiOiJjb2RlcmlkZS13ZWJzaXRlL2NvZGVyaWRlLWNvZGUtZGVtby0xX3Nob3J0LTE2OS5tcDQiLCJpYXQiOjE3NDgzODAzMDgsImV4cCI6MTc3OTkxNjMwOH0.9j4saX6u1CmXlZiqGMDvhQmacLidjvXSRVTYRr9B7F0" target="_blank">here to watch the demo</a>.
  </video>
</p>

*   **Deep Project Understanding for Your AI:** Equip your AI agents with rich, structured context from your CodeRide projects and tasks. Let them see the bigger picture.
*   **Seamless AI-Powered Task Automation:** Empower AIs to fetch, interpret, and update tasks directly in CodeRide, automating routine project management.
*   **Bridge the Gap Between Human & AI Developers:** Foster true collaboration with smoother handoffs, consistent task understanding, and aligned efforts.
*   **Optimized for LLM Efficiency:** Compact JSON responses minimize token usage, ensuring faster, more cost-effective AI interactions.
*   **Secure by Design:** Workspace-scoped API key authentication ensures your data's integrity and that AI operations are confined to the correct project context.
*   **Plug & Play Integration:** Effortlessly set up with `npx` in any MCP-compatible environment. Get your AI connected in minutes!
*   **Future-Proof Your Workflow:** Embrace an AI-native approach to development, built on the open Model Context Protocol standard.

## Core Capabilities

The CodeRide MCP server provides your AI with the following capabilities:

*   **Task Retrieval:** Fetch specific tasks by their unique number.
*   **Task Updates:** Modify task descriptions and statuses.
*   **Prompt Access:** Get tailored prompts and instructions for specific tasks.
*   **Project Details:** Retrieve information about projects by their slug.
*   **Project Knowledge Management:** Update a project's knowledge graph and architecture diagrams.
*   **Project Initiation:** Get the first task of a project to kickstart work.

## Getting Started

It's easy to get CodeRide MCP running and integrated into your AI agent's environment.

**Prerequisites:**

1.  **Node.js and npm:** Ensure you have Node.js (which includes npm) installed. `npx` comes with npm.
2.  **CodeRide Account & API Key:** This MCP server is designed exclusively for registered CodeRide users. You'll need an active CodeRide account and an API key, which you can obtain from your workspace settings on [app.coderide.ai](https://app.coderide.ai).

**MCP Configuration:**

Add the following configuration to your MCP client (e.g., Claude Desktop's `claude_desktop_config.json`, Cursor, Cline, Windsurf, VS Code settings, etc.):

```json
{
  "mcpServers": {
    "coderide": {
      "command": "npx",
      "args": [
        "-y",
        "@coderide/mcp"
      ],
      "env": {
        "CODERIDE_API_KEY": "YOUR_CODERIDE_API_KEY_HERE"
      }
    }
  }
}
```

**Important:**

*   Replace `"YOUR_CODERIDE_API_KEY_HERE"` with your actual CodeRide API key.

Once configured, your MCP client will automatically start and connect to the CodeRide MCP server, making its tools available to your AI for interacting with your projects and tasks on CodeRide.

## Who is this for?

CodeRide MCP is for:

*   **Developers using AI coding assistants:** Integrate your AI tools (Cursor, Cline, Windsurf, etc.) deeply with your CodeRide task management.
*   **Teams adopting AI-driven development:** Standardize how AI agents access project information and contribute to tasks.
*   **Anyone building with MCP:** Leverage a powerful example of an MCP server that connects to a real-world SaaS platform.

If you're looking to make your AI assistant a more productive and integrated member of your development team, CodeRide MCP is for you.

## Available Tools

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

## Technical Highlights

*   **Workspace-Centered Authentication:** API keys are tied to specific workspaces. All operations are automatically scoped, simplifying requests and enhancing security. No need to pass `workspaceId`!
*   **User-Friendly Identifiers:** Interact with tasks and projects using human-readable numbers (e.g., "TCA-3") and slugs (e.g., "TCA") instead of internal UUIDs.
*   **Optimized Responses:** All tools return compact JSON, minimizing token usage for LLM communication.
*   **Robust API Interaction:** Uses the official CodeRide API (`https://api.coderide.ai` by default) for all operations.

## Local Development & Contribution

This section is for those interested in contributing to the CodeRide MCP package itself or running a local development version for testing modifications. Note that even when run locally, this server connects to the production CodeRide API.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/PixdataOrg/coderide-mcp
    cd coderide-mcp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and add your `CODERIDE_API_KEY`.
    ```env
    CODERIDE_API_KEY=your_api_key_here
    ```

4.  **Build and Run:**
    *   Build the project:
        ```bash
        npm run build
        ```
    *   Run the server:
        ```bash
        npm start
        ```
    *   For development with auto-restarts on file changes:
        ```bash
        npm run dev
        ```


## About CodeRide

**CodeRide is where AI and human developers unite to build better software, faster.**

It's more than just task management; it's an AI-native platform built from the ground up to support the unique workflows of AI-assisted software development. CodeRide provides the essential structured context, project knowledge, and external memory that AI agents require to understand complex projects, contribute meaningfully, and collaborate effectively with their human counterparts.

Transform your development process with a tool that truly understands the synergy between human ingenuity and artificial intelligence.

Discover the future of software development at [coderide.ai](https://coderide.ai).

## Contributing

Contributions are welcome! Please feel free to submit issues, fork the repository, and create pull requests.

## License

All rights reserved. See the [LICENSE](LICENSE) file for details.

## Support & Community

*   Have questions or need help with `@coderide/mcp`? [Open an issue](https://github.com/PixdataOrg/coderide-mcp/issues) on our GitHub repository.
*   Want to learn more about CodeRide? Visit [coderide.ai](https://coderide.ai) or join our community (Link to community forum/Discord if available).
