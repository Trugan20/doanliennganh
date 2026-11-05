import { io, type Socket } from "socket.io-client";

const API_BASE_URL = "http://localhost:5000/api";
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export interface IncomingConversationMessage {
  conversationId: string;
  message: {
    _id: string;
    sender: { _id: string; name: string; avatar?: string };
    type: "text" | "image" | "audio";
    content?: string;
    imageUrl?: string;
    audioUrl?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

type MessageListener = (event: IncomingConversationMessage) => void;

class ChatSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private listeners = new Set<MessageListener>();

  connect(token: string) {
    if (this.socket && this.token === token) return;

    this.disconnect();
    this.token = token;
    this.socket = io(`${SOCKET_URL}/chat-events`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    this.socket.on("conversation:new-message", (event: IncomingConversationMessage) => {
      this.listeners.forEach((listener) => listener(event));
    });
    this.socket.on("connect_error", (error) => {
      console.warn("[ChatSocket] Connection error:", error.message);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.token = null;
  }

  onMessage(listener: MessageListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const chatSocketService = new ChatSocketService();
