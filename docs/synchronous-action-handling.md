# Synchronous Action Handling in Chrome MCP

This document explains the implementation of synchronous action handling in the Chrome MCP server, which ensures that actions are processed one at a time and new messages are only sent to the extension after clearing the last action.

## Overview

The Chrome MCP server has been updated to handle actions synchronously, which means:

1. Actions are processed one at a time in the order they were received
2. New messages are only sent after the previous action has been completed
3. The system properly handles errors and timeouts
4. The action queue is properly cleaned up when the connection is closed

## Implementation Details

The implementation uses two levels of synchronization:

### 1. Context-Level Synchronization

In `src/context.ts`, an action queue system has been implemented to manage multiple tool calls:

```typescript
export class Context {
  private _ws: WebSocket | undefined;
  private _actionInProgress: boolean = false;
  private _actionQueue: Array<{ type: string; payload: any; resolve: Function; reject: Function }> = [];

  // ...

  async sendSocketMessage(type: string, payload: any): Promise<any> {
    // Create a promise that will be resolved when the action completes
    return new Promise((resolve, reject) => {
      // Add the action to the queue
      this._actionQueue.push({ type, payload, resolve, reject });
      
      // Process the queue if no action is in progress
      if (!this._actionInProgress) {
        this._processNextAction();
      }
    });
  }

  private async _processNextAction(): Promise<void> {
    // If there are no actions in the queue, return
    if (this._actionQueue.length === 0) {
      this._actionInProgress = false;
      return;
    }

    // Set the action in progress flag
    this._actionInProgress = true;

    // Get the next action from the queue
    const { type, payload, resolve, reject } = this._actionQueue.shift()!;

    try {
      // Send the message and wait for the response
      const sender = createSocketMessageSender(this.ws);
      const result = await sender(type, payload);
      
      // Resolve the promise with the result
      resolve(result);
    } catch (error) {
      // Reject the promise with the error
      reject(error);
    } finally {
      // Process the next action in the queue
      setTimeout(() => this._processNextAction(), 0);
    }
  }

  // ...
}
```

### 2. Sender-Level Synchronization

In `src/sender.ts`, a completion flag is used to ensure WebSocket messages are sent sequentially:

```typescript
// Track the last action completion across all senders
let lastActionCompleted = true;

export const createSocketMessageSender = (ws: WebSocket) => {
  return (type: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      // ...

      // Wait until the last action is completed before sending a new one
      const sendMessage = () => {
        if (lastActionCompleted) {
          try {
            // Mark that we're starting a new action
            lastActionCompleted = false;
            ws.send(message);
          } catch (error) {
            // ...
            lastActionCompleted = true; // Reset the flag on error
            // ...
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
```

### 3. Server-Level Integration

In `src/server.ts`, the WebSocket connection handler has been updated to work with the synchronous action handling:

```typescript
websocket.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log(`[Chrome MCP] Received message: ${JSON.stringify(message)}`);
    
    // Process responses from the extension
    if (message.type && message.type.endsWith('_complete')) {
      console.log(`[Chrome MCP] Action completed: ${message.type}`);
      // The message ID is handled by the sender function to resolve the corresponding promise
      // No need to do anything here as the sender will handle the resolution
    } else if (message.type === 'heartbeat_ack') {
      console.log('[Chrome MCP] Received heartbeat acknowledgment');
    } else if (message.type === 'error') {
      console.error(`[Chrome MCP] Error from extension: ${JSON.stringify(message.data)}`);
    }
  } catch (error) {
    console.error(`[Chrome MCP] Error parsing message: ${error}`);
  }
});
```

## Benefits

This synchronous action handling implementation provides several benefits:

1. **Reliability**: Actions are processed in the order they were received, ensuring consistent behavior
2. **Stability**: The system can handle errors and timeouts gracefully
3. **Efficiency**: Resources are used more efficiently by avoiding parallel processing of actions
4. **Simplicity**: The code is easier to reason about since actions are processed sequentially

## Potential Improvements

Future improvements to the synchronous action handling could include:

1. Adding priority levels to the action queue
2. Implementing a timeout for the entire queue to prevent deadlocks
3. Adding metrics to track action processing times
4. Implementing a retry mechanism for failed actions
