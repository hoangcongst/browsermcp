// Placeholder types for messaging
export type MessageType = string;

export interface MessagePayload<T = any> {
  id: string;
  type: MessageType;
  data: T;
}

// Placeholder map for socket messages
export type SocketMessageMap = {
  [key: string]: any;
};
