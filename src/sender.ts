import type { WebSocket, RawData } from "ws";

// Track the last action completion across all senders
let lastActionCompleted = true;

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
        lastActionCompleted = true; // Reset the flag on timeout
        reject(new Error(`Timeout waiting for response to message type: ${type} (ID: ${id.substring(0, 8)}...)`));
      }, timeoutMs);

      const handleMessage = (rawData: RawData) => {
        try {
          const response = JSON.parse(rawData.toString());
          
          // Check if this is the response to our message by ID
          if (response.id === id) {
            // Clean up
            clearTimeout(timeoutId);
            ws.off("message", handleMessage);
            
            console.log(`[Chrome MCP] Received response for message: ${type} (ID: ${id.substring(0, 8)}...)`);
            
            // Mark the action as completed
            lastActionCompleted = true;
            
            if (response.error) {
              console.error(`[Chrome MCP] Error in response: ${response.error}`);
              reject(new Error(response.error));
            } else {
              resolve(response.data);
            }
            return;
          }
        } catch (error) {
          console.warn(`[Chrome MCP] Failed to parse WebSocket message: ${error}`);
          // Continue listening for other messages
        }
      };

      ws.on("message", handleMessage);
      
      // Wait until the last action is completed before sending a new one
      const sendMessage = () => {
        if (lastActionCompleted) {
          try {
            // Mark that we're starting a new action
            lastActionCompleted = false;
            ws.send(message);
          } catch (error) {
            clearTimeout(timeoutId);
            ws.off("message", handleMessage);
            lastActionCompleted = true; // Reset the flag on error
            console.error(`[Chrome MCP] Failed to send WebSocket message: ${error}`);
            reject(error);
          }
        } else {
          // If the last action is not completed, wait and try again
          setTimeout(sendMessage, 100);
        }
      };
      
      // Start the sending process
      sendMessage();
    });
  };
};
