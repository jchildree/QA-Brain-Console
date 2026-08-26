import { useEffect, useRef, useState } from 'react';
import { sendChatMessage, loadChatSession, saveChatSession, clearChatSession } from '../api/chat';
import type { ChatMessage, ChatSession } from '../api/chat';

const DEFAULT_SCOPES: string[] = [];

const RECORD_TYPES = [
  { slug: 'sops', label: 'SOP' },
  { slug: 'cap', label: 'CAP' },
  { slug: 'incident', label: 'Incident' },
  { slug: 'change', label: 'Change' },
  { slug: 'audit', label: 'Audit' },
  { slug: 'training', label: 'Training' },
  { slug: 'meeting', label: 'Meeting' },
];

function newSession(): ChatSession {
  return {
    id: `session-${Date.now()}`,
    messages: [],
    scopes: DEFAULT_SCOPES,
    createdAt: Date.now(),
    lastMessageAt: Date.now(),
  };
}

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSession(loadChatSession() || newSession());
  }, []);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, isOpen]);

  const handleSendMessage = async () => {
    if (!session || !inputValue.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    const priorMessages = session.messages;
    const updated: ChatSession = {
      ...session,
      messages: [...priorMessages, userMessage],
      lastMessageAt: Date.now(),
    };
    setSession(updated);
    saveChatSession(updated);
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      const reply = await sendChatMessage(userMessage.content, priorMessages);
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: reply.text,
        timestamp: Date.now(),
      };
      const final: ChatSession = { ...updated, messages: [...updated.messages, assistantMessage] };
      setSession(final);
      saveChatSession(final);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleScope = (scope: string) => {
    if (!session) return;
    const updated: ChatSession = {
      ...session,
      scopes: session.scopes.includes(scope) ? session.scopes.filter((s) => s !== scope) : [...session.scopes, scope],
    };
    setSession(updated);
    saveChatSession(updated);
  };

  const handleClearSession = () => {
    if (!confirm('Clear chat history?')) return;
    clearChatSession();
    setSession(newSession());
  };

  if (!session) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: 'var(--gold)', color: 'var(--paper)', zIndex: 40, border: '1px solid var(--rule)' }}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div
          className="fixed bottom-20 right-4 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] flex flex-col rounded-xl border shadow-xl"
          style={{ borderColor: 'var(--rule)', background: 'var(--paper-2)', zIndex: 39 }}
        >
          <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--rule)' }}>
            <h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
              Claude Chat
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm font-mono"
              style={{ color: 'var(--ink-dim)' }}
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>

          <div className="px-3 py-2 border-b text-xs" style={{ borderColor: 'var(--rule)', color: 'var(--ink-dim)' }}>
            <div className="font-bold mb-1">Scope</div>
            <div className="flex flex-wrap gap-2">
              {RECORD_TYPES.map(({ slug, label }) => (
                <label key={slug} className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={session.scopes.includes(slug)} onChange={() => handleToggleScope(slug)} />
                  <span className="text-xs">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {session.messages.length === 0 && (
              <p className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>
                Start a conversation. Scope selections are a hint for future record-aware retrieval.
              </p>
            )}
            {session.messages.map((msg) => (
              <div key={msg.id} className={`text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className="inline-block max-w-[85%] px-3 py-2 rounded-lg"
                  style={{
                    background: msg.role === 'user' ? 'var(--gold)' : 'var(--card)',
                    color: msg.role === 'user' ? 'var(--paper)' : 'var(--ink)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--rule)',
                  }}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>
                Claude is typing&hellip;
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="px-3 py-2 text-xs font-mono" style={{ color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <div className="flex gap-2 p-3 border-t" style={{ borderColor: 'var(--rule)' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask something&hellip;"
              disabled={loading}
              className="flex-1 px-3 py-2 rounded text-sm border"
              style={{ background: 'var(--paper)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
            />
            <button type="button" onClick={handleSendMessage} disabled={loading || !inputValue.trim()} className="accession-btn px-3 py-2">
              Send
            </button>
          </div>

          <button
            type="button"
            onClick={handleClearSession}
            className="text-xs font-mono mx-3 mb-3 px-2 py-1 border rounded self-start"
            style={{ borderColor: 'var(--ink-dim)', color: 'var(--ink-dim)', background: 'transparent' }}
          >
            Clear History
          </button>
        </div>
      )}
    </>
  );
}
