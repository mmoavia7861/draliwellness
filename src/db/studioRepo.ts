import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  chatMessages,
  chatThreads,
  mediaGenerations,
  searchQueries,
  users,
} from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email || 'user@dralihassanwellness.pk',
        displayName: displayName || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || 'user@dralihassanwellness.pk',
          ...(displayName ? { displayName } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Unable to save user session to SQL database.', { cause: error });
  }
}

export async function listUserChatThreads(userId: number) {
  try {
    return await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.userId, userId))
      .orderBy(desc(chatThreads.updatedAt))
      .limit(20);
  } catch (error) {
    console.error('Database query failed in listUserChatThreads:', error);
    throw new Error('Unable to load chat threads.', { cause: error });
  }
}

export async function createChatThread(input: {
  userId: number;
  title: string;
  rolePreset: string;
  model: string;
  systemInstruction: string;
}) {
  try {
    const rows = await db
      .insert(chatThreads)
      .values({
        userId: input.userId,
        title: input.title,
        rolePreset: input.rolePreset,
        model: input.model,
        systemInstruction: input.systemInstruction,
        updatedAt: new Date(),
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.error('Database query failed in createChatThread:', error);
    throw new Error('Unable to create chat thread.', { cause: error });
  }
}

export async function getThreadForUser(threadId: number, userId: number) {
  try {
    const rows = await db
      .select()
      .from(chatThreads)
      .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getThreadForUser:', error);
    throw new Error('Unable to verify chat thread.', { cause: error });
  }
}

export async function listThreadMessages(threadId: number) {
  try {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.threadId, threadId))
      .orderBy(chatMessages.id);
  } catch (error) {
    console.error('Database query failed in listThreadMessages:', error);
    throw new Error('Unable to load chat messages.', { cause: error });
  }
}

export async function appendChatMessage(input: {
  threadId: number;
  role: 'user' | 'model';
  content: string;
  model?: string;
  groundingSourcesJson?: string;
}) {
  try {
    const rows = await db
      .insert(chatMessages)
      .values({
        threadId: input.threadId,
        role: input.role,
        content: input.content,
        model: input.model || null,
        groundingSourcesJson: input.groundingSourcesJson || null,
      })
      .returning();

    await db
      .update(chatThreads)
      .set({ updatedAt: new Date() })
      .where(eq(chatThreads.id, input.threadId));

    return rows[0];
  } catch (error) {
    console.error('Database query failed in appendChatMessage:', error);
    throw new Error('Unable to store chat message.', { cause: error });
  }
}

export async function deleteChatThreadForUser(threadId: number, userId: number) {
  try {
    const deleted = await db
      .delete(chatThreads)
      .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)))
      .returning();
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteChatThreadForUser:', error);
    throw new Error('Unable to delete chat thread.', { cause: error });
  }
}

export async function recordMediaGeneration(input: {
  userId: number;
  kind: 'image' | 'image_edit' | 'video';
  prompt: string;
  model: string;
  aspectRatio?: string;
  mimeType: string;
}) {
  try {
    const rows = await db
      .insert(mediaGenerations)
      .values({
        userId: input.userId,
        kind: input.kind,
        prompt: input.prompt,
        model: input.model,
        aspectRatio: input.aspectRatio || null,
        mimeType: input.mimeType,
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.error('Database query failed in recordMediaGeneration:', error);
    throw new Error('Unable to log media generation.', { cause: error });
  }
}

export async function listUserMediaGenerations(userId: number) {
  try {
    return await db
      .select()
      .from(mediaGenerations)
      .where(eq(mediaGenerations.userId, userId))
      .orderBy(desc(mediaGenerations.createdAt))
      .limit(20);
  } catch (error) {
    console.error('Database query failed in listUserMediaGenerations:', error);
    throw new Error('Unable to load media generation history.', { cause: error });
  }
}

export async function recordSearchQuery(input: {
  userId?: number | null;
  query: string;
  summary: string;
  sourcesJson: string;
  model: string;
}) {
  try {
    const rows = await db
      .insert(searchQueries)
      .values({
        userId: input.userId ?? null,
        query: input.query,
        summary: input.summary,
        sourcesJson: input.sourcesJson,
        model: input.model,
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.error('Database query failed in recordSearchQuery:', error);
    throw new Error('Unable to save search query.', { cause: error });
  }
}

export async function listRecentSearchQueries(userId?: number | null) {
  try {
    if (userId) {
      return await db
        .select()
        .from(searchQueries)
        .where(eq(searchQueries.userId, userId))
        .orderBy(desc(searchQueries.createdAt))
        .limit(10);
    }
    return await db
      .select()
      .from(searchQueries)
      .orderBy(desc(searchQueries.createdAt))
      .limit(10);
  } catch (error) {
    console.error('Database query failed in listRecentSearchQueries:', error);
    throw new Error('Unable to load recent search queries.', { cause: error });
  }
}
