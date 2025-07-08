# Browser MCP Installation Guide

This guide will help you set up Browser MCP for AI-driven browser automation.

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Chrome or Chromium-based browser
- AI application that supports MCP (e.g., Windsurf, Claude Desktop, VS Code with MCP extension)

## Installation Steps

### 1. Install the MCP Server

```bash
# Clone the forked repository
git clone https://github.com/hoangcongst/browsermcp.git
cd browsermcp

# Install dependencies
pnpm install

# Build the project
pnpm build

# Link globally for easy access (optional)
pnpm link --global
```

### 2. Install the Browser Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Navigate to the `extension` folder in this project and select it
5. The Browser MCP extension should now appear in your extensions list

### 3. Configure Your AI Application

Add Browser MCP to your AI application's MCP configuration:

#### For Windsurf
Add to your `windsurf_config.json`:
```json
{
  "mcpServers": {
    "browsermcp": {
      "command": "mcp-server-browsermcp"
    }
  }
}
```

*Note: If you didn't link globally, use the full path:*
```json
{
  "mcpServers": {
    "browsermcp": {
      "command": "node",
      "args": ["/path/to/browsermcp/dist/index.js"]
    }
  }
}
```

#### For Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "browsermcp": {
      "command": "mcp-server-browsermcp"
    }
  }
}
```

*Note: If you didn't link globally, use the full path:*
```json
{
  "mcpServers": {
    "browsermcp": {
      "command": "node",
      "args": ["/path/to/browsermcp/dist/index.js"]
    }
  }
}
```

## Usage

### 1. Start the MCP Server

```bash
# If linked globally
mcp-server-browsermcp

# Or run from the project directory
cd /path/to/browsermcp
pnpm start

# Or run the built file directly
node dist/index.js
```

The server will start and listen for:
- MCP connections via stdio (for AI applications)
- WebSocket connections on port 8080 (for browser extension)

### 2. Open Your Browser

1. Make sure the Browser MCP extension is installed and enabled
2. Navigate to any website
3. The extension will automatically connect to the MCP server
4. Check the extension popup to verify connection status

### 3. Use with AI Applications

Once everything is set up, you can use natural language commands in your AI application:

- "Take a screenshot of the current page"
- "Click on the login button"
- "Navigate to google.com"
- "Fill in the search box with 'AI automation'"
- "Get the page title and URL"

## Troubleshooting

### Server Issues
- **Port already in use**: Change the port in `src/config.ts` and rebuild
- **Permission denied**: Make sure you have proper permissions to run the server

### Extension Issues
- **Extension not loading**: Check that all files are present in the extension folder
- **Connection failed**: Ensure the MCP server is running on port 8080
- **Commands not working**: Check browser console for error messages

### AI Application Issues
- **MCP server not found**: Verify the server path in your AI application config
- **Commands not available**: Restart your AI application after adding the MCP server

## Development

To contribute or modify Browser MCP:

1. Fork the repository
2. Make your changes
3. Test with both the server and extension
4. Submit a pull request

For extension development:
- Modify files in the `extension/` directory
- Reload the extension in Chrome after changes
- Check browser console for debug logs

For server development:
- Modify files in the `src/` directory
- Run `pnpm build` to rebuild
- Restart the server to test changes

## Security Notes

- The extension requires broad permissions to automate any website
- Only install from trusted sources
- The WebSocket connection is local (localhost) by default
- Be cautious when automating sensitive websites or data

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/hoangcongst/browsermcp/issues
- Original Project: https://github.com/browsermcp/mcp
- This Fork: https://github.com/hoangcongst/browsermcp
