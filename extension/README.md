# Browser MCP Extension

This is the browser extension component of Browser MCP that enables AI applications to control and automate web browsers.

## Installation

### For Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this `extension` directory
4. The Browser MCP extension should now appear in your extensions list

### For Production

The extension will be available on the Chrome Web Store once published.

## Features

- **WebSocket Connection**: Connects to the Browser MCP server via WebSocket
- **Browser Automation**: Executes commands from AI applications including:
  - Navigation (go to URLs, back/forward)
  - Element interaction (click, type, hover, select)
  - Information gathering (screenshots, page snapshots, console logs)
  - Keyboard and mouse actions
- **ARIA Snapshot Capture**: Provides semantic representation of web pages for AI understanding
- **Real-time Status**: Shows connection status and current page information
- **Auto-reconnection**: Automatically attempts to reconnect if connection is lost

## How It Works

1. The extension content script runs on all web pages
2. It connects to the Browser MCP server via WebSocket (localhost:8080)
3. When AI applications send commands through the MCP server, the extension receives them and executes the corresponding browser actions
4. Results and page state are sent back to the AI application through the same channel

## Configuration

The extension connects to `ws://localhost:8080` by default. Make sure the Browser MCP server is running on this port.

## Files

- `manifest.json` - Extension manifest with permissions and configuration
- `src/content.js` - Content script that runs on web pages and handles automation
- `src/background.js` - Background service worker for screenshots and console logs
- `src/popup.html` - Extension popup interface
- `src/popup.js` - Popup functionality and status display

## Permissions

The extension requires the following permissions:
- `activeTab` - Access to the current active tab
- `tabs` - Tab management for navigation
- `storage` - Store extension settings
- `debugger` - Capture console logs
- `<all_urls>` - Access to all websites for automation

## Troubleshooting

1. **Connection Issues**: Check that the Browser MCP server is running on port 8080
2. **Extension Not Loading**: Ensure all files are present and manifest.json is valid
3. **Commands Not Working**: Check the browser console for error messages
4. **Popup Not Showing Status**: Refresh the page and check the extension is properly loaded

## Development

To modify the extension:

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh button on the Browser MCP extension
4. Test your changes

The extension logs debug information to the browser console with the prefix `[Browser MCP]`.
