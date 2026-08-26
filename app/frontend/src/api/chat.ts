// Frontend client for the persistent chat panel. Consumes the existing
// POST /api/chat endpoint (app/backend/src/routes/chat.js, Wave 8) -- this
// file does not define or duplicate that route.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  scopes: string[]; // record type slugs like 'sops', 'cap', 'incident', etc. -- UI-only for now
  createdAt: number;
  lastMessageAt: number;
}

export interface ChatReply {
  text: string;
  toolUse?: { name: string; input: Record<string, unknown> };
}

// POST /api/chat responds with a single JSON body { text, toolUse? } -- see
// normalize() in routes/chat.js. Not a stream; the server buffers the full
// provider reply before responding.
export async function sendChatMessage(message: string, previousMessages: ChatMessage[]): Promise<ChatReply> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      message,
      messages: previousMessages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))).error;
    throw new Error(detail || 'Chat request failed');
  }
  return res.json();
}

// Session management (localStorage)
const CHAT_SESSION_KEY = 'qa-brain-chat-session';

export function loadChatSession(): ChatSession | null {
  try {
    const raw = localStorage.getItem(CHAT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveChatSession(session: ChatSession): void {
  try {
    localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('Failed to persist chat session:', err);
  }
}

export function clearChatSession(): void {
  localStorage.removeItem(CHAT_SESSION_KEY);
}
