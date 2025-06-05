'use server';

import { db } from "@/app/db/db.server";
import { chats, messages, type Chat, type Message, MessageRole, type MessagePart, type DBMessage } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateTitle } from "@/app/actions/title";

export async function saveMessages({
    messages: dbMessages,
}: {
    messages: Array<DBMessage>;
}) {
    try {
        if (dbMessages.length > 0) {
            const chatId = dbMessages[0].chatId;

            // First delete any existing messages for this chat
            await db
                .delete(messages)
                .where(eq(messages.chatId, chatId));

            // Then insert the new messages
            return await db.insert(messages).values(dbMessages);
        }
        return null;
    } catch (error) {
        console.error('Failed to save messages in database', error);
        throw error;
    }
}

export async function saveChat({ id, userId, messages: aiMessages, title }: {
    id?: string;
    userId: string;
    messages?: any[];
    title?: string;
}) {
    // Generate a new ID if one wasn't provided
    const chatId = id || nanoid();

    // Check if title is provided, if not generate one
    let chatTitle = title;

    // Generate title if messages are provided and no title is specified
    if (aiMessages && aiMessages.length > 0) {
        const hasEnoughMessages = aiMessages.length >= 2 &&
            aiMessages.some(m => m.role === 'user') &&
            aiMessages.some(m => m.role === 'assistant');

        if (!chatTitle || chatTitle === 'New Chat' || chatTitle === undefined) {
            if (hasEnoughMessages) {
                try {
                    // Use AI to generate a meaningful title based on conversation
                    chatTitle = await generateTitle(aiMessages);
                } catch (error) {
                    console.error('Error generating title:', error);
                    // Fallback to basic title extraction if AI title generation fails
                    const firstUserMessage = aiMessages.find(m => m.role === 'user');
                    if (firstUserMessage) {
                        // Check for parts first (new format)
                        if (firstUserMessage.parts && Array.isArray(firstUserMessage.parts)) {
                            const textParts = firstUserMessage.parts.filter((p: MessagePart) => p.type === 'text' && p.text);
                            if (textParts.length > 0) {
                                chatTitle = textParts[0].text?.slice(0, 50) || 'New Chat';
                                if ((textParts[0].text?.length || 0) > 50) {
                                    chatTitle += '...';
                                }
                            } else {
                                chatTitle = 'New Chat';
                            }
                        }
                        // Fallback to content (old format)
                        else if (typeof firstUserMessage.content === 'string') {
                            chatTitle = firstUserMessage.content.slice(0, 50);
                            if (firstUserMessage.content.length > 50) {
                                chatTitle += '...';
                            }
                        } else {
                            chatTitle = 'New Chat';
                        }
                    } else {
                        chatTitle = 'New Chat';
                    }
                }
            } else {
                // Not enough messages for AI title, use first message
                const firstUserMessage = aiMessages.find(m => m.role === 'user');
                if (firstUserMessage) {
                    // Check for parts first (new format)
                    if (firstUserMessage.parts && Array.isArray(firstUserMessage.parts)) {
                        const textParts = firstUserMessage.parts.filter((p: MessagePart) => p.type === 'text' && p.text);
                        if (textParts.length > 0) {
                            chatTitle = textParts[0].text?.slice(0, 50) || 'New Chat';
                            if ((textParts[0].text?.length || 0) > 50) {
                                chatTitle += '...';
                            }
                        } else {
                            chatTitle = 'New Chat';
                        }
                    }
                    // Fallback to content (old format)
                    else if (typeof firstUserMessage.content === 'string') {
                        chatTitle = firstUserMessage.content.slice(0, 50);
                        if (firstUserMessage.content.length > 50) {
                            chatTitle += '...';
                        }
                    } else {
                        chatTitle = 'New Chat';
                    }
                } else {
                    chatTitle = 'New Chat';
                }
            }
        }
    } else {
        chatTitle = chatTitle || 'New Chat';
    }

    // Check if chat already exists
    const existingChat = await db
        .select()
        .from(chats)
        .where(
            and(
                eq(chats.id, chatId),
                eq(chats.userId, userId)
            )
        )
        .limit(1);

    if (existingChat.length > 0) {
        // Update existing chat
        await db
            .update(chats)
            .set({
                title: chatTitle,
                updatedAt: new Date()
            })
            .where(and(
                eq(chats.id, chatId),
                eq(chats.userId, userId)
            ));
    } else {
        // Create new chat
        await db.insert(chats).values({
            id: chatId,
            userId,
            title: chatTitle,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    return { id: chatId };
}

export async function getChats(userId: string) {
    return await db
        .select()
        .from(chats)
        .where(eq(chats.userId, userId))
        .orderBy(desc(chats.updatedAt));
}

export async function getChatById(id: string, userId: string): Promise<(Chat & { messages: Message[] }) | null> {
    const chat = await db
        .select()
        .from(chats)
        .where(
            and(
                eq(chats.id, id),
                eq(chats.userId, userId)
            )
        )
        .limit(1);

    if (chat.length === 0) return null;

    const chatMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, id))
        .orderBy(messages.createdAt);

    return {
        ...chat[0],
        messages: chatMessages
    };
}

export async function deleteChat(id: string, userId: string) {
    await db
        .delete(chats)
        .where(
            and(
                eq(chats.id, id),
                eq(chats.userId, userId)
            )
        );
} 