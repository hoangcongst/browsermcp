import type { WebSocket } from "ws";

import { createSocketMessageSender } from "./sender";

const noConnectionMessage = `No connection to browser extension. In order to proceed, you must first connect a tab by clicking the Chrome MCP extension icon in the browser toolbar and clicking the 'Connect' button.`;

export class Context {
  private _ws: WebSocket | undefined;
  private _actionInProgress: boolean = false;
  private _actionQueue: Array<{ type: string; payload: any; resolve: Function; reject: Function }> = [];

  get ws(): WebSocket {
    if (!this._ws) {
      throw new Error(noConnectionMessage);
    }
    return this._ws;
  }

  set ws(ws: WebSocket) {
    this._ws = ws;
  }

  hasWs(): boolean {
    return !!this._ws;
  }

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

  async close() {
    if (!this._ws) {
      return;
    }
    // Clear the action queue and reject any pending actions
    while (this._actionQueue.length > 0) {
      const { reject } = this._actionQueue.shift()!;
      reject(new Error('Connection closed'));
    }
    this._actionInProgress = false;
    await this._ws.close();
  }
}
