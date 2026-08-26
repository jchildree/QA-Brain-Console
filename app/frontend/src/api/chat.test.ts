import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendChatMessage, loadChatSession, saveChatSession, clearChatSession } from './chat';
import type { ChatMessage, ChatSession } from './chat';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  localStorage.clear();
});

describe('sendChatMessage', () => {
  it('POSTs message and prior history, returning the { text } reply', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ text: 'hello there' }) });
    const prior: ChatMessage[] = [{ id: '1', role: 'user', content: 'hi', timestamp: 1 }];

    const result = await sendChatMessage('follow up', prior);

    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: 'follow up', messages: [{ role: 'user', content: 'hi' }] }),
    });
    expect(result).toEqual({ text: 'hello there' });
  });

  it('throws with the server error detail on failure', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'message is required' }) });
    await expect(sendChatMessage('', [])).rejects.toThrow('message is required');
  });
});

describe('chat session persistence', () => {
  it('round-trips a session through localStorage', () => {
    expect(loadChatSession()).toBeNull();

    const session: ChatSession = {
      id: 's1',
      messages: [{ id: 'm1', role: 'user', content: 'hi', timestamp: 1 }],
      scopes: ['sops'],
      createdAt: 1,
      lastMessageAt: 1,
    };
    saveChatSession(session);
    expect(loadChatSession()).toEqual(session);

    clearChatSession();
    expect(loadChatSession()).toBeNull();
  });
});
