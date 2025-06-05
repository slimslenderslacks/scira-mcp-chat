import { Message, MessagePart } from '@/lib/db';

export async function generateTitle(messages: Message[]): Promise<string> {
    // Get the first user message
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Chat';

    // Extract text content from the message parts
    const parts = firstUserMessage.parts as MessagePart[];
    const textParts = parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text');

    if (textParts.length === 0) return 'New Chat';

    // Get the first text part
    const textContent = textParts[0].text;

    // If no text content, return default title
    if (!textContent) return 'New Chat';

    // Truncate and format the title
    const title = textContent.slice(0, 50);
    return title.length < textContent.length ? `${title}...` : title;
} 