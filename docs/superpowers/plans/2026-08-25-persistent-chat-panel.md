# Persistent Chat Panel in Console UI — Execution Plan

**Wave:** 14 (after push-subscription-management, Wave 13, since both touch AppShell.tsx)
**Consumes:** `POST /api/chat` route and `provider.chat()` (Wave 8, backend-chat-endpoint-provider-methods) -- DO NOT recreate routes/chat.js or re-edit its index.js mount
**Produces:** ChatPanel UI mounted in the app shell
**Owns exclusively:** app/frontend/src/api/chat.ts, app/frontend/src/components/ChatPanel.tsx, app/frontend/src/components/AppShell.tsx (chat panel mount only)

## Goal
Add a persistent, collapsible chat sidebar mounted at the AppShell level, available across every page/route in the console. Users can converse with Claude in a threaded interface scoped to selected record types, with session history persisted to localStorage.

## Context
- **Frontend**: React + TypeScript at `app/frontend/src/`
- **Backend**: Node.js/Express at `app/backend/src/`
- **Existing patterns**: 
  - API clients follow the pattern in `api/client.ts` (factory functions, `createRecordApi()`, fetch with auth)
  - Components styled with CSS variables (`--paper`, `--ink`, `--gold`, etc.) matching vault-paper theme
  - AppShell wraps all routes; can mount persistent UI there
  - Anthropic provider already integrated in backend (`src/providers/anthropicProvider.js`)
  - localStorage used for app state (OnboardingContext pattern)
- **Auth**: AuthContext already provides username/role; reuse it

## Step-by-Step Tasks

### 1. Create Frontend Chat API Client
**File**: `app/frontend/src/api/chat.ts`

Create a streaming chat client mirroring the pattern in `api/client.ts`:

```typescript
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
  scopes: string[]; // record type slugs like 'sops', 'cap', 'incident', etc.
  createdAt: number;
  lastMessageAt: number;
}

export async function streamChatMessage(
  message: string,
  scopes: string[],
  previousMessages: ChatMessage[]
): Promise<ReadableStream<string>> {
  // POST /api/chat with streaming
  // Body: { message, scopes, previousMessages }
  // Returns text/event-stream (or Response with readable stream)
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, scopes, previousMessages }),
  });
  
  if (!res.ok) throw new Error('Chat request failed');
  
  // Handle streaming response
  if (!res.body) throw new Error('No response body');
  return res.body;
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
```

**Verification**: Client exports functions that match the streaming and session patterns used in OnboardingContext (fetch with credentials, try/catch JSON parsing, localStorage key).

---

### 2. Create Frontend Chat Panel Component
**File**: `app/frontend/src/components/ChatPanel.tsx`

A collapsible drawer component that:
- Renders a message thread with streaming text
- Provides an input form with send button
- Shows a scope picker (checkboxes for record types: SOP, CAP, Incident, Change, Audit, Training, Meeting)
- Uses CSS variables for styling (vault-paper theme)
- Integrates with AuthContext for username display
- Persists session to localStorage on every message

Structure (React component, ~350 lines):

```typescript
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { streamChatMessage, loadChatSession, saveChatSession, clearChatSession } from '../api/chat';
import type { ChatMessage, ChatSession } from '../api/chat';

const DEFAULT_SCOPES = ['sops', 'cap', 'incident']; // or empty, user chooses

export function ChatPanel() {
  const { username } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load session on mount
  useEffect(() => {
    const loaded = loadChatSession();
    setSession(loaded || {
      id: `session-${Date.now()}`,
      messages: [],
      scopes: DEFAULT_SCOPES,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    });
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleSendMessage = async () => {
    if (!session || !inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      // Add user message to session
      const updated = {
        ...session,
        messages: [...session.messages, userMessage],
        lastMessageAt: Date.now(),
      };
      setSession(updated);
      saveChatSession(updated);

      // Stream assistant response
      const stream = await streamChatMessage(
        userMessage.content,
        session.scopes,
        session.messages
      );

      let assistantText = '';
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      // For now, collect the entire stream then add as one message
      // (If backend sends SSE, parse event: data format here)
      let chunk;
      while (!(chunk = await reader.read()).done) {
        assistantText += decoder.decode(chunk.value, { stream: true });
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: assistantText,
        timestamp: Date.now(),
      };

      const final = {
        ...updated,
        messages: [...updated.messages, assistantMessage],
      };
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
    const updated = {
      ...session,
      scopes: session.scopes.includes(scope)
        ? session.scopes.filter((s) => s !== scope)
        : [...session.scopes, scope],
    };
    setSession(updated);
    saveChatSession(updated);
  };

  const handleClearSession = () => {
    if (confirm('Clear chat history?')) {
      clearChatSession();
      setSession({
        id: `session-${Date.now()}`,
        messages: [],
        scopes: DEFAULT_SCOPES,
        createdAt: Date.now(),
        lastMessageAt: Date.now(),
      });
    }
  };

  if (!session) return null;

  const RECORD_TYPES = [
    { slug: 'sops', label: 'SOP' },
    { slug: 'cap', label: 'CAP' },
    { slug: 'incident', label: 'Incident' },
    { slug: 'change', label: 'Change' },
    { slug: 'audit', label: 'Audit' },
    { slug: 'training', label: 'Training' },
    { slug: 'meeting', label: 'Meeting' },
  ];

  return (
    <div
      className="fixed bottom-0 right-0 w-[400px] h-[600px] flex flex-col rounded-tl-xl border"
      style={{
        borderColor: 'var(--rule)',
        background: 'var(--paper-2)',
        display: isOpen ? 'flex' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--rule)' }}>
        <h3 className="font-bold" style={{ color: 'var(--ink)' }}>Claude Chat</h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-sm font-mono"
          style={{ color: 'var(--ink-dim)' }}
        >
          ✕
        </button>
      </div>

      {/* Scopes */}
      <div className="px-4 py-2 border-b text-xs" style={{ borderColor: 'var(--rule)', color: 'var(--ink-dim)' }}>
        <div className="font-bold mb-1">Scope</div>
        <div className="flex flex-wrap gap-2">
          {RECORD_TYPES.map(({ slug, label }) => (
            <label key={slug} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={session.scopes.includes(slug)}
                onChange={() => handleToggleScope(slug)}
              />
              <span className="text-xs">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {session.messages.length === 0 && (
          <p className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>
            Start a conversation. Messages are scoped to the selected record types.
          </p>
        )}
        {session.messages.map((msg) => (
          <div key={msg.id} className={`text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div
              className="inline-block max-w-xs px-3 py-2 rounded-lg"
              style={{
                background: msg.role === 'user' ? 'var(--gold)' : 'var(--card)',
                color: 'var(--ink)',
              }}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>
            Claude is typing…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-xs font-mono" style={{ color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 p-4 border-t" style={{ borderColor: 'var(--rule)' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder="Ask something…"
          disabled={loading}
          className="flex-1 px-3 py-2 rounded text-sm border"
          style={{
            background: 'var(--paper)',
            borderColor: 'var(--rule)',
            color: 'var(--ink)',
          }}
        />
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={loading || !inputValue.trim()}
          className="accession-btn px-3 py-2"
        >
          Send
        </button>
      </div>

      {/* Clear Session Button */}
      <button
        type="button"
        onClick={handleClearSession}
        className="text-xs font-mono m-2 px-2 py-1 border rounded"
        style={{
          borderColor: 'var(--ink-dim)',
          color: 'var(--ink-dim)',
          background: 'transparent',
        }}
      >
        Clear History
      </button>
    </div>
  );
}

// Also export a toggle button to add to AppShell
export function ChatToggleButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: 'var(--gold)',
          color: 'var(--ink)',
          zIndex: 40,
        }}
        title="Open chat"
      >
        💬
      </button>
      {isOpen && <ChatPanel onClose={() => setIsOpen(false)} />}
    </>
  );
}
```

**Verification**: Component renders messages, input, scope picker, handles streaming text, persists to localStorage, uses CSS variables for theme, reuses AuthContext for username if needed.

---

### 3. Integrate Chat Panel into AppShell
**File**: `app/frontend/src/components/AppShell.tsx`

Modify to include the chat panel:

```typescript
// At the top with other imports
import { ChatPanel } from './ChatPanel';

export function AppShell({ children }: { children: ReactNode }) {
  // ... existing code ...
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] ...">
      {/* ... existing header, nav, main ... */}
      <main>{children}</main>
      
      {/* Add at the end */}
      <ChatPanel />
    </div>
  );
}
```

**Verification**: ChatPanel mounts at AppShell level, available on all routes, doesn't interfere with existing layout.

---

### 4. Create Backend Chat Endpoint
**File**: `app/backend/src/routes/chat.js`

New route handler for POST `/api/chat` with streaming:

```javascript
const { Router } = require('express');
const { getProvider } = require('../providers');

function createChatRouter(provider) {
  const router = Router();

  // POST /api/chat
  // Body: { message, scopes, previousMessages }
  // Returns: text/event-stream or streamed plain text
  router.post('/chat', async (req, res) => {
    const { message, scopes, previousMessages } = req.body;
    const username = req.user?.username || 'unknown';

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    try {
      // For now: simple streaming. Build a system prompt that includes
      // the scopes and context about what records this session can draft into.
      const scopeLabels = (scopes || []).join(', ') || 'all record types';
      const systemPrompt = `You are a QA assistant helping with quality management records in the QA Brain system. 
The current user is ${username}. 
This chat session is scoped to: ${scopeLabels}.
When drafting content, only reference records and concepts from the selected types.
Keep responses concise and actionable.`;

      // Format previous messages for the API call
      const messages = [
        ...(previousMessages || []).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      // Stream the response from Claude
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');

      // Use the provider to call Anthropic with streaming
      // (adapt based on provider's API -- if not available, use client.messages.stream)
      const anthropic = require('@anthropic-ai/sdk');
      const client = new anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

      let buffer = '';
      const stream = await client.messages.stream({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      });

      stream.on('text', (text) => {
        res.write(text);
        buffer += text;
      });

      stream.on('end', () => {
        res.end();
      });

      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream failed' });
        } else {
          res.end();
        }
      });
    } catch (err) {
      console.error('Chat error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Chat failed' });
      } else {
        res.end();
      }
    }
  });

  return router;
}

module.exports = { createChatRouter };
```

**Verification**: 
- Route accepts message, scopes, previousMessages
- Builds context-aware system prompt
- Streams text response from Anthropic
- Handles errors gracefully
- Uses existing Anthropic provider pattern

---

### 5. Wire Backend Chat Route into Main App
**File**: `app/backend/src/index.js`

Add chat router after other routes:

```javascript
// Near the top with other requires
const { createChatRouter } = require('./routes/chat');

// In the middleware setup (after auth):
app.use('/api/chat', requireAuth);
app.use('/api', createChatRouter(provider));
```

**Verification**: Route is protected by requireAuth, mounted at `/api/chat`, provider is passed in.

---

### 6. Environment Configuration
**File**: `app/backend/.env` (ensure set)

Ensure `ANTHROPIC_API_KEY` is configured. If using a custom provider, check `app/backend/src/providers/index.js` to confirm it passes through to `createChatRouter`.

---

### 7. Frontend TypeScript Types (Optional Enhancement)
**File**: `app/frontend/src/api/chat.ts`

Already included above; ensure exported types are used in ChatPanel.tsx import statements.

---

## Verification Steps

### Unit / Component Level
1. **ChatPanel component**:
   - Renders correctly (visible when isOpen = true, hidden when false)
   - Scope checkboxes toggle properly
   - Input field clears after send
   - Messages persist to localStorage
   - Loads session on mount

2. **api/chat.ts**:
   - streamChatMessage returns a ReadableStream
   - loadChatSession/saveChatSession round-trip correctly
   - localStorage key doesn't collide with other keys

3. **Backend chat route**:
   - POST /api/chat accepts { message, scopes, previousMessages }
   - Returns 400 if message is missing
   - Calls Anthropic client with system prompt
   - Streams text without crashing on empty input

### Integration Level
1. **AppShell integration**:
   - ChatPanel mounts at app root without breaking layout
   - Panel is visible on all routes
   - Doesn't overlap main content (fixed position, bottom-right)

2. **End-to-end**:
   - User types message in ChatPanel
   - Click Send → POST /api/chat fires
   - Text streams in and renders in message list
   - Message persists to localStorage
   - Reload page → previous messages are restored
   - Toggling scopes doesn't lose messages

3. **Auth & Scoping**:
   - Chat endpoint returns 401 if not authenticated
   - Scopes are passed to backend correctly
   - System prompt includes selected scopes

### Styling & UX
- Panel uses CSS variables (--paper, --ink, --gold, --rule) consistently with rest of app
- Panel is responsive (fits on narrow screens, scrolls if needed)
- Message bubbles are visually distinct (user vs. assistant)
- Loading state shows "Claude is typing…"
- Error messages are readable and actionable

---

## Known Simplifications & Future Enhancements

- **Streaming Format**: Currently collects entire response, then adds as one message. For true token-level streaming UI, use Server-Sent Events (SSE) format from backend and parse `event: data` in frontend.
- **Session Limit**: No size limit on localStorage. Add pagination/archiving if sessions grow very large.
- **Context Window**: No vault file context injected yet. The sibling child item (backend chat scoping) will add vault-aware retrieval.
- **Voice**: Not included; text-only for MVP.
- **Markdown**: Message content rendered as plain text. Add `<Markdown />` component if rich formatting is needed.

---

## Files to Create / Modify

| File | Action | Size |
|------|--------|------|
| `app/frontend/src/api/chat.ts` | Create | ~200 lines |
| `app/frontend/src/components/ChatPanel.tsx` | Create | ~350 lines |
| `app/frontend/src/components/AppShell.tsx` | Modify | +5 lines (import & render) |
| `app/backend/src/routes/chat.js` | Create | ~80 lines |
| `app/backend/src/index.js` | Modify | +3 lines (require & wire) |
| `app/backend/.env` | Verify | (ANTHROPIC_API_KEY) |

---

## Execution Order

1. **Create backend route** (`app/backend/src/routes/chat.js`)
2. **Wire backend** (modify `app/backend/src/index.js`)
3. **Create frontend API client** (`app/frontend/src/api/chat.ts`)
4. **Create ChatPanel component** (`app/frontend/src/components/ChatPanel.tsx`)
5. **Integrate into AppShell** (modify `app/frontend/src/components/AppShell.tsx`)
6. **Test end-to-end** (send message, verify streaming, reload, verify localStorage)

This order ensures backend is ready before frontend tries to call it.

---

## Notes for Developer

- Reuse the pattern from `api/client.ts` for all fetch calls (BASE_URL, credentials: 'include', error handling).
- Match CSS variable usage from `RecordEditor.tsx` and `RecordIntake.tsx`.
- localStorage error handling is not critical (try/catch wraps, falls back to session-only state).
- No tests required for MVP (depth 3); add if revisiting.
- The chat endpoint is intentionally simple — real vault integration (retrieving SOP/CAP content by scope) is the sibling child item.
