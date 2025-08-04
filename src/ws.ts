import { WebSocketServer } from "ws";

import { mcpConfig } from "./config";
import { wait } from "./utils";

import { isPortInUse, killProcessOnPort } from "@/utils/port";

export async function createWebSocketServer(
  port: number = mcpConfig.webSocket.port,
): Promise<WebSocketServer> {
  console.error(`[Chrome MCP] Setting up WebSocket server on port ${port}`);
  
  // Kill any process that might be using the port
  killProcessOnPort(port);
  
  // Wait until the port is free
  let attempts = 0;
  while (await isPortInUse(port)) {
    attempts++;
    console.error(`[Chrome MCP] Port ${port} still in use, waiting... (attempt ${attempts})`);
    await wait(100);
    if (attempts > 50) {
      console.error(`[Chrome MCP] Failed to free up port ${port} after ${attempts} attempts`);
      throw new Error(`Could not start WebSocket server: port ${port} is in use`);
    }
  }
  
  console.error(`[Chrome MCP] Creating WebSocket server on port ${port}`);
  const wss = new WebSocketServer({ port });
  
  // Add event handlers to the WebSocket server
  wss.on('listening', () => {
    console.error(`[Chrome MCP] WebSocket server is listening on port ${port}`);
  });
  
  wss.on('error', (error) => {
    console.error(`[Chrome MCP] WebSocket server error:`, error);
  });
  
  return wss;
}
