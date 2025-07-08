import type { WebSocket, RawData } from "ws";

export const createSocketMessageSender = (ws: WebSocket) => {
  return (type: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const message = JSON.stringify({ id, type, data });

      const handleMessage = (rawData: RawData) => {
        try {
          const response = JSON.parse(rawData.toString());
          if (response.id === id) {
            ws.off("message", handleMessage); // Use off() to remove listener
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.data);
            }
          }
        } catch (error) {
          // Ignore messages that are not valid JSON
        }
      };

      ws.on("message", handleMessage); // Use on() to add listener
      ws.send(message);
    });
  };
};
