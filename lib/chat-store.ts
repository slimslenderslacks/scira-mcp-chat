import { type Chat, type Message, type MessagePart } from "./db";
import { type DBMessage } from "./db/schema";
import { nanoid } from "nanoid";
import { saveMessages, saveChat, getChats, getChatById, deleteChat } from "@/app/actions/chat";
import { type UIMessage as AISDKUIMessage } from "ai";

type AIMessage = {
  role: string;
  content: string | any[];
  id?: string;
  parts?: MessagePart[];
};

type UIMessage = {
  id: string;
  role: string;
  content: string;
  parts: MessagePart[];
  createdAt?: Date;
};

type SaveChatParams = {
  id?: string;
  userId: string;
  messages?: any[];
  title?: string;
};

type ChatWithMessages = Chat & {
  messages: Message[];
};

// Function to convert AI SDK UI messages to simpler AIMessage format
export function convertUIMessagesToAIMessages(uiMessages: AISDKUIMessage[]): AIMessage[] {
  return uiMessages.map(msg => {
    // Extract text content from complex parts
    let content = '';
    const simpleParts: MessagePart[] = [];

    if (msg.parts) {
      // Process each part and extract relevant information
      for (const part of msg.parts) {
        const anyPart = part as any; // Use any to bypass strict type checking

        if (anyPart.type === 'text' && anyPart.text) {
          content += anyPart.text;
          simpleParts.push({ type: 'text', text: anyPart.text });
        } else if (anyPart.type === 'image' && anyPart.image_url) {
          // Keep image parts if they match our schema
          simpleParts.push({ type: 'image', image_url: anyPart.image_url });
        }
        // Skip other complex part types like reasoning, tool invocations, etc.
        // as they're not part of our database schema
      }
    }

    return {
      id: msg.id,
      role: msg.role,
      content: content || (typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)),
      parts: simpleParts.length > 0 ? simpleParts : undefined
    };
  });
}

// Function to convert AI messages to DB format
export function convertToDBMessages(aiMessages: AIMessage[], chatId: string): DBMessage[] {
  return aiMessages.map(msg => {
    // Use existing id or generate a new one
    const messageId = msg.id || nanoid();

    // If msg has parts, use them directly
    if (msg.parts) {
      return {
        id: messageId,
        chatId,
        role: msg.role,
        parts: msg.parts,
        createdAt: new Date()
      };
    }

    // Otherwise, convert content to parts
    let parts: MessagePart[];

    if (typeof msg.content === 'string') {
      parts = [{ type: 'text', text: msg.content }];
    } else if (Array.isArray(msg.content)) {
      if (msg.content.every(item => typeof item === 'object' && item !== null)) {
        // Content is already in parts-like format
        parts = msg.content as MessagePart[];
      } else {
        // Content is an array but not in parts format
        parts = [{ type: 'text', text: JSON.stringify(msg.content) }];
      }
    } else {
      // Default case
      parts = [{ type: 'text', text: String(msg.content) }];
    }

    return {
      id: messageId,
      chatId,
      role: msg.role,
      parts,
      createdAt: new Date()
    };
  });
}

// Convert DB messages to UI format
export function convertToUIMessages(dbMessages: Array<Message>): Array<UIMessage> {
  return dbMessages.map((message) => ({
    id: message.id,
    parts: message.parts as MessagePart[],
    role: message.role as string,
    content: getTextContent(message), // For backward compatibility
    createdAt: message.createdAt,
  }));
}

// Helper to get just the text content for display
export function getTextContent(message: Message): string {
  try {
    const parts = message.parts as MessagePart[];
    return parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(part => part.text)
      .join('\n');
  } catch (e) {
    // If parsing fails, return empty string
    return '';
  }
}

// Re-export server actions
export { saveMessages, saveChat, getChats, getChatById, deleteChat }; 