import type { WebSocket, RawData } from "ws";

export const createSocketMessageSender = (ws: WebSocket) => {
  return (type: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const message = JSON.stringify({ id, type, data });
      
      console.log(`[Chrome MCP] Sending message: ${type} (ID: ${id.substring(0, 8)}...)`);
      
      // Set a timeout to prevent hanging indefinitely
      const timeoutMs = 30000; // 30 seconds
      const timeoutId = setTimeout(() => {
        ws.off("message", handleMessage);
        reject(new Error(`Timeout waiting for response to message type: ${type} (ID: ${id.substring(0, 8)}...)`));
      }, timeoutMs);

      const handleMessage = (rawData: RawData) => {
        try {
          const response = JSON.parse(rawData.toString());
          
          // Check if this is the response to our message
          if (response.id === id) {
            // Clean up
            clearTimeout(timeoutId);
            ws.off("message", handleMessage);
            
            console.log(`[Chrome MCP] Received response for message: ${type} (ID: ${id.substring(0, 8)}...)`);
            
            if (response.error) {
              console.error(`[Chrome MCP] Error in response: ${response.error}`);
              reject(new Error(response.error));
            } else {
              resolve(response.data);
            }
          }
        } catch (error) {
          console.warn(`[Chrome MCP] Failed to parse WebSocket message: ${error}`);
          // Continue listening for other messages
        }
      };

      ws.on("message", handleMessage);
      
      try {
        ws.send(message);
      } catch (error) {
        clearTimeout(timeoutId);
        ws.off("message", handleMessage);
        console.error(`[Chrome MCP] Failed to send WebSocket message: ${error}`);
        reject(error);
      }
    });
  };
};
