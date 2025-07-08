import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { Context } from "@/context";
import type { Resource } from "@/resources/resource";
import type { Tool } from "@/tools/tool";
import { createWebSocketServer } from "@/ws";

type Options = {
  name: string;
  version: string;
  tools: Tool[];
  resources: Resource[];
};

export async function createServerWithTools(options: Options): Promise<Server> {
  const { name, version, tools, resources } = options;
  const context = new Context();
  const server = new Server(
    { name, version },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  );

  const wss = await createWebSocketServer();
  wss.on("connection", (websocket, request) => {
    console.log(`[Chrome MCP] New WebSocket connection from ${request.socket.remoteAddress}`);
    
    // Close any existing connections
    if (context.hasWs()) {
      console.log('[Chrome MCP] Closing existing WebSocket connection');
      context.ws.close();
    }
    
    // Set up event handlers for this connection
    websocket.on('error', (error) => {
      console.error('[Chrome MCP] WebSocket connection error:', error);
    });
    
    websocket.on('close', (code, reason) => {
      console.log(`[Chrome MCP] WebSocket connection closed with code ${code}, reason: ${reason || 'No reason provided'}`);
    });
    
    // Store the connection in context
    context.ws = websocket;
    console.log('[Chrome MCP] WebSocket connection established successfully');
    
    // Handle incoming messages
    websocket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`[Chrome MCP] Received message: ${JSON.stringify(message)}`);
        
        // Process responses from the extension
        if (message.type && message.type.endsWith('_complete')) {
          console.log(`[Chrome MCP] Action completed: ${message.type}`);
          // The message ID should be used to resolve the corresponding promise in the sender
        } else if (message.type === 'heartbeat_ack') {
          console.log('[Chrome MCP] Received heartbeat acknowledgment');
        } else if (message.type === 'error') {
          console.error(`[Chrome MCP] Error from extension: ${JSON.stringify(message.data)}`);
        }
      } catch (error) {
        console.error(`[Chrome MCP] Error parsing message: ${error}`);
      }
    });
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: tools.map((tool) => tool.schema) };
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: resources.map((resource) => resource.schema) };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find((tool) => tool.schema.name === request.params.name);
    if (!tool) {
      return {
        content: [
          { type: "text", text: `Tool "${request.params.name}" not found` },
        ],
        isError: true,
      };
    }

    try {
      const result = await tool.handle(context, request.params.arguments);
      return result;
    } catch (error) {
      return {
        content: [{ type: "text", text: String(error) }],
        isError: true,
      };
    }
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resource = resources.find(
      (resource) => resource.schema.uri === request.params.uri,
    );
    if (!resource) {
      return { contents: [] };
    }

    const contents = await resource.read(context, request.params.uri);
    return { contents };
  });

  server.close = async () => {
    await server.close();
    await wss.close();
    await context.close();
  };

  return server;
}
