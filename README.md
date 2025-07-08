## About

**Note:** This project is a substantial independent continuation of the original [browsermcp/mcp project](https://github.com/browsermcp/mcp). Significant changes, new features, and ongoing maintenance are by me. Attribution to the original authors is retained for reused code, per Apache 2.0 requirements.

Chrome MCP is a Model Context Protocol (MCP) server that enables AI applications to automate and interact with web browsers. It consists of two main components:

- **MCP Server**: A Node.js server that exposes browser automation tools via the MCP protocol
- **Browser Extension**: A Chrome/Firefox extension that receives commands from the server and executes them in the browser

This allows AI applications like Claude, Cursor, Windsurf, and VS Code to control your browser, navigate websites, click elements, fill forms, and capture screenshots - all while using your existing browser profile and staying logged into your accounts.

## How It Works

1. **AI Application** ↔ **MCP Server** (via stdio/MCP protocol)
2. **MCP Server** ↔ **Browser Extension** (via WebSocket)
3. **Browser Extension** ↔ **Web Pages** (via browser APIs)

The MCP server acts as a bridge between AI applications and your browser, translating high-level AI commands into specific browser actions.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [pnpm](https://pnpm.io/)
*   The **Chrome MCP** browser extension installed in your browser
*   An AI application that supports MCP (Claude Desktop, Cursor, Windsurf, etc.)

### Quick Start

```bash
# Clone and run from source
git clone https://github.com/hoangcongst/browsermcp.git
cd browsermcp
pnpm install && pnpm build && pnpm start
```

**Important**: You also need to install the browser extension from the `extension/` folder.

📖 **See [INSTALLATION.md](./INSTALLATION.md) for complete setup instructions including browser extension installation and AI application configuration.**

Then you can run the server with:

```bash
mcp-server-browsermcp
```

Alternatively, you can run it directly for development and inspection:

```bash
pnpm run inspector
```

This will start the server and the MCP Inspector, allowing you to see requests and responses in real-time.

## Workflow

### 1. Setup and Connection
1. Install and build the MCP server (this project)
2. Install the Chrome MCP extension in your browser
3. Configure your AI application to connect to the MCP server
4. Start the MCP server

### 2. AI-Driven Browser Automation
1. **AI Request**: Your AI application sends a command (e.g., "click the login button")
2. **MCP Processing**: The MCP server receives the request and identifies the appropriate tool
3. **WebSocket Communication**: The server sends the command to the browser extension via WebSocket
4. **Browser Action**: The extension executes the action in the browser (clicking, typing, navigating)
5. **Snapshot Capture**: The extension captures the current page state (ARIA accessibility tree)
6. **Response**: The updated page state is sent back to the AI application

### 3. Available Actions
- **Navigation**: Go to URLs, go back/forward
- **Element Interaction**: Click buttons, fill forms, select dropdowns
- **Information Gathering**: Take screenshots, get console logs, capture page snapshots
- **Keyboard Actions**: Press keys, type text
- **Mouse Actions**: Hover over elements, drag and drop

## Features

- ⚡ Fast: Automation happens locally on your machine, resulting in better performance without network latency.
- 🔒 Private: Since automation happens locally, your browser activity stays on your device and isn't sent to remote servers.
- 👤 Logged In: Uses your existing browser profile, keeping you logged into all your services.
- 🥷🏼 Stealth: Avoids basic bot detection and CAPTCHAs by using your real browser fingerprint.

## Contributing

This repo contains all the core MCP code for Chrome MCP, but currently cannot yet be built on its own due to dependencies on utils and types from the monorepo where it's developed.

## Credits

Chrome MCP was adapted from the [Playwright MCP server](https://github.com/microsoft/playwright-mcp) in order to automate the user's browser rather than creating new browser instances. This allows using the user's existing browser profile to use logged-in sessions and avoid bot detection mechanisms that commonly block automated browser use.
