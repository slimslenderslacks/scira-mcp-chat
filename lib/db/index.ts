import * as schema from "./schema";

// Export schema for type usage in client components
export { schema };

// Export types that might be needed in client components
export type Chat = typeof schema.chats.$inferSelect;
export type Message = typeof schema.messages.$inferSelect;
export type MessagePart = {
  type: 'text';
  text: string;
} | {
  type: 'image';
  image_url: string;
}; 