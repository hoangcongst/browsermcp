# Chrome MCP Architecture

This document provides an overview of the Chrome MCP server architecture and its key components.

## Overview

Chrome MCP (Model Context Protocol) is a server that allows AI models to interact with Chrome browser instances through a WebSocket connection. It provides a set of tools that can be used to perform actions in the browser, such as clicking elements, typing text, navigating to URLs, and taking screenshots.

## Key Components

### 1. Server

The server component (`src/server.ts`) is responsible for:
- Creating and managing the WebSocket server
- Handling incoming requests from AI models
- Routing requests to the appropriate tools
- Managing resources

### 2. Context

The context component (`src/context.ts`) is responsible for:
- Managing the WebSocket connection to the browser extension
- Providing a queue-based system for synchronous action handling
- Sending messages to the browser extension
- Handling connection lifecycle events

### 3. Sender

The sender component (`src/sender.ts`) is responsible for:
- Creating and sending WebSocket messages to the browser extension
- Handling responses from the browser extension
- Implementing the synchronous action handling at the message level
- Managing timeouts and error handling

### 4. Tools

The tools are organized into several categories:
- Common tools (`src/tools/common.ts`): Basic browser actions like navigation and key presses
- Custom tools (`src/tools/custom.ts`): Specialized actions like getting console logs and screenshots
- Snapshot tools (`src/tools/snapshot.ts`): Actions related to accessibility snapshots

## Synchronous Action Handling

A key feature of the Chrome MCP server is its synchronous action handling, which ensures that actions are processed one at a time and new messages are only sent to the extension after clearing the last action. For detailed information about this feature, see [Synchronous Action Handling](./synchronous-action-handling.md).

## Flow of a Typical Request

1. An AI model sends a request to the MCP server to call a tool
2. The server routes the request to the appropriate tool handler
3. The tool handler uses the context to send a message to the browser extension
4. The context adds the action to the queue and processes it when it's at the front of the queue
5. The sender creates a WebSocket message and sends it to the browser extension when the previous action is completed
6. The browser extension performs the action and sends a response back to the server
7. The sender receives the response and resolves the promise
8. The context processes the next action in the queue
9. The tool handler returns the result to the server
10. The server sends the result back to the AI model

## Extension Integration

The Chrome MCP server communicates with a browser extension that injects content scripts into web pages. The extension is responsible for:
- Establishing a WebSocket connection to the server
- Receiving messages from the server
- Performing actions in the browser
- Sending responses back to the server

The extension uses a content script (`extension/src/content.js`) to interact with web pages and perform actions like clicking elements, typing text, and taking screenshots.
