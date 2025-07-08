# Local Development Guide

This guide explains how to set up and run Browser MCP locally for development and testing.

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Chrome or Chromium-based browser
- AI application that supports MCP (Windsurf, Claude Desktop, etc.)

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/hoangcongst/chromemcp.git
cd chromemcp
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build the Project

```bash
pnpm build
```

This creates the `dist/` directory with the compiled JavaScript files.

## Running Locally

### Option 1: Using pnpm start (Recommended)

```bash
pnpm start
```

This runs `node dist/index.js` and starts the MCP server.

### Option 2: Direct Node Execution

```bash
node dist/index.js
```

### Option 3: Global Linking (For Development)

```bash
# Link the package globally
pnpm link --global

# Now you can run from anywhere
mcp-server-chromemcp
```

## Development Workflow

### 1. Make Changes
Edit files in the `src/` directory or `extension/` directory.

### 2. Rebuild (for server changes)
```bash
pnpm build
```

### 3. Restart Server
Stop the current server (Ctrl+C) and restart:
```bash
pnpm start
```

### 4. Reload Extension (for extension changes)
1. Go to `chrome://extensions/`
2. Find "Browser MCP" extension
3. Click the refresh/reload button

## AI Application Configuration

### For Windsurf

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "chromemcp": {
      "command": "node",
      "args": ["/absolute/path/to/chromemcp/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/chromemcp` with your actual project path.

### For Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "chromemcp": {
      "command": "node",
      "args": ["/absolute/path/to/chromemcp/dist/index.js"]
    }
  }
}
```

## Browser Extension Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/` folder from this project
5. The extension should appear in your extensions list

## Testing the Setup

### 1. Start the Server
```bash
cd /path/to/chromemcp
pnpm start
```

You should see:
```
MCP server started - listening for connections via stdio
WebSocket server listening on port 8080
```

### 2. Test WebSocket Connection
```bash
node test-websocket.js
```

You should see:
```
✅ Connected to Browser MCP WebSocket server
🏁 Test complete, closing connection
🔌 Connection closed
```

### 3. Check Extension Status
1. Open any website in Chrome
2. Click the Browser MCP extension icon
3. Verify it shows "Connected to MCP Server"

### 4. Test with AI Application
Try commands like:
- "Take a screenshot of the current page"
- "Navigate to google.com"
- "Get the page title"

## Troubleshooting

### Server Won't Start
- Check if port 8080 is already in use: `lsof -i :8080`
- Make sure you've run `pnpm build` after making changes
- Check for TypeScript errors: `pnpm typecheck`

### Extension Won't Connect
- Verify the server is running on port 8080
- Check browser console for error messages
- Reload the extension in Chrome extensions page

### AI Application Can't Find Server
- Use absolute paths in your MCP configuration
- Make sure the server is running before starting your AI application
- Check AI application logs for connection errors

## File Structure

```
chromemcp/
├── src/                    # Server source code (TypeScript)
│   ├── index.ts           # Main entry point
│   ├── server.ts          # MCP server setup
│   ├── tools/             # Browser automation tools
│   └── config.ts          # Configuration
├── extension/              # Browser extension
│   ├── manifest.json      # Extension manifest
│   └── src/               # Extension scripts
├── dist/                  # Built server code (generated)
├── docs/                  # Documentation
└── package.json           # Node.js configuration
```

## Publishing Your Fork

When you're ready to publish your fork:

1. Update version in `package.json`
2. Create a GitHub release
3. Optionally publish to npm:
   ```bash
   npm publish --access public
   ```

## Contributing

To contribute back to this fork:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

For issues or questions, use the GitHub Issues page: https://github.com/hoangcongst/chromemcp/issues
