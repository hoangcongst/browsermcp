import type { WebSocket } from "ws";

import { createSocketMessageSender } from "./sender";

const noConnectionMessage = `No connection to browser extension. In order to proceed, you must first connect a tab by clicking the Chrome MCP extension icon in the browser toolbar and clicking the 'Connect' button.`;

export class Context {
  private _ws: WebSocket | undefined;

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
    const sender = createSocketMessageSender(this.ws);
    try {
      // The sender function now handles the promise, timeout is implicitly handled
      return await sender(type, payload);
    } catch (e) {
      // Generic error re-throw, specific check removed
      throw e;
    }
  }

  async close() {
    if (!this._ws) {
      return;
    }
    await this._ws.close();
  }
}
