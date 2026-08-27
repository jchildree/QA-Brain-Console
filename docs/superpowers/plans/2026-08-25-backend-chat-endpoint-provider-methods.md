# Backend Chat Endpoint and Provider Chat Methods

**Wave:** 8 (parallel with smarter-automation-auto-link-tag-fill; disjoint files)
**Consumes:** none
**Produces:** `POST /api/chat` route; `provider.chat()` methods on each provider; this is the SOLE producer of the chat route -- scoped-chat-draft-capability (Wave 9) and persistent-chat-panel (Wave 14) must consume it, not recreate it
**Owns exclusively:** app/backend/src/providers/anthropicProvider.js, cliProvider.js, customProvider.js, index.js (providers), app/backend/src/routes/chat.js, app/backend/src/index.js (chat route mount)

**Goal:** Add a `/api/chat` endpoint to the backend that streams or returns Claude's reply to multi-turn conversations, where Claude has read-only tool access to vault search and record reading.

**Context:** The backend already has three AI providers (Anthropic SDK, CLI, custom endpoint), vault access for reading records, and a search endpoint. The chat feature reuses these without introducing new persistence or infrastructure—a first pass is stateless (client resends history each turn).

---

## Tasks

### Task 1: Add `chat` method to anthropicProvider

**File:** `app/backend/src/providers/anthropicProvider.js`

Add a `chat` method alongside `extractFields`. The method:
- Accepts `messages` (array of `{ role, content }` pairs) and `tools` (array of tool definitions)
- Calls `client.messages.create()` with `model: 'claude-sonnet-5'`, `max_tokens: 2048`
- Returns a Promise resolving to the full response object (or parsed text if non-streaming)
- Handles tool_use blocks by returning them as-is (caller processes them)

Pattern: Match the shape of `client.messages.create()` directly—pass messages, tools, and model params through.

**Verification:** Can instantiate provider and call `chat()` with test messages and tool definitions without error.

---

### Task 2: Add `chat` method to cliProvider

**File:** `app/backend/src/providers/cliProvider.js`

Add a `chat` method that:
- Accepts `messages` (array) and `tools` (array of tool definitions)
- Constructs a prompt: inject system context about available tools, then append all user/assistant messages as narrative context
- Spawns `claude` CLI with `-p` (prompt mode), writes prompt to stdin
- Parses response: if it contains markdown code blocks with tool calls, extract them; otherwise treat as plain text
- Returns a structured response: `{ text: string, toolUse?: { name, input } }`

Pattern: Reuse `defaultRunner` for consistent error handling.

**Verification:** CLI provider can accept messages and tool definitions; can round-trip a question and receive a text response.

---

### Task 3: Add `chat` method to customProvider

**File:** `app/backend/src/providers/customProvider.js`

Extend the contract comment at the top to document the new chat endpoint:
```
POST { messages: Array, tools: Array } -> 200 { text: string, toolUse?: { name, input } }
```

Add a `chat` method that:
- Accepts `messages` (array) and `tools` (array of tool definitions)
- POST to `${endpoint}/chat` with `{ messages, tools }` in JSON body
- Returns the parsed JSON response from the endpoint

Pattern: Match the existing `extractFields` approach (one async fetch call).

**Verification:** Can construct and call chat method; handles endpoint errors gracefully (throw with useful message).

---

### Task 4: Create chat route

**File:** `app/backend/src/routes/chat.js` (new file)

Create a router factory that:
1. Exports `createChatRouter(provider, recordTypes)` function
2. Registers `POST /chat` endpoint
3. Request body: `{ message: string, messages?: Array }` (messages = prior conversation history, each `{ role, content }`)
4. Returns response: `{ text: string, toolUse?: { name, input } }`

**Tool definitions:** Pass a static array of two tools to provider.chat():
- `search`: `{ name: "search", description: "Search vault records", input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } }`
- `readRecord`: `{ name: "readRecord", description: "Read a specific record", input_schema: { type: "object", properties: { type: { type: "string", enum: ["sop", "cap", "incident", ...] }, filename: { type: "string" } }, required: ["type", "filename"] } }`

**Error handling:**
- 400 if message is missing or empty
- 400 if messages array contains invalid shape
- 502 if provider.chat() throws
- 401 handled by requireAuth middleware (applied in index.js)

**First pass (stateless):** Do not execute tools on behalf of Claude. Return the full response from provider and let the client handle tool execution if needed. (Future: add tool execution loop here if needed.)

**Verification:** POST to `/api/chat` with a message; receive a text response from Claude within 2 seconds.

---

### Task 5: Wire chat route in index.js

**File:** `app/backend/src/index.js`

1. Import: `const { createChatRouter } = require('./routes/chat');`
2. After search route wiring (line ~79), add:
   ```javascript
   app.use('/api/chat', requireAuth);
   app.use('/api', createChatRouter(provider, RECORD_TYPES));
   ```

**Verification:** Server starts without errors; `/api/chat` is guarded by auth (returns 401 without valid session).

---

### Task 6: Update providers/index.js exports (if needed)

**File:** `app/backend/src/providers/index.js`

Verify all three provider factories export a `chat` method (in addition to `extractFields`). No changes needed if the pattern is consistent.

---

## Acceptance Criteria

1. **All three providers have a chat method** that accepts `messages` (array) and `tools` (array), returns a Promise resolving to structured response.
2. **Chat endpoint exists** at `POST /api/chat`, accepts `{ message, messages? }`, returns `{ text, toolUse? }`.
3. **Auth is enforced**: calling `/api/chat` without valid session cookie returns 401.
4. **No tool execution** in the first pass—provider receives tool definitions but caller decides what to do with tool_use blocks.
5. **Server starts cleanly** with no console errors; route is wired correctly.
6. **Conversation history is stateless**: client resends full history on each turn (MVP approach).

---

## Testing / Verification Steps

1. Start backend: `npm run dev` in `app/backend/`
2. Authenticate: POST to `/api/auth/login` with valid username/password, capture session cookie
3. Test message: POST to `/api/chat` with `{ "message": "What SOPs do we have?" }`, include session cookie
4. Expect response: `{ "text": "..." }` within 2s
5. Test history: POST to `/api/chat` with `{ "message": "Tell me more", "messages": [{ "role": "user", "content": "What SOPs do we have?" }, { "role": "assistant", "content": "..." }] }`
6. Expect response: Claude answers based on prior context
7. Verify no errors in console; all three providers callable if switched via `AI_PROVIDER` env var

---

## Notes

- **No new dependencies**: uses existing Anthropic SDK, express, child_process
- **Tool execution is deferred**: the route returns tool_use blocks for the client to handle, no execution loop in first pass
- **Vault access**: recordTypes config (already in config.js) provides mapping of type → dir for record reading
- **Streaming deferred**: initial implementation returns full response; streaming can be added later if needed
- **Conversation persistence deferred**: using req.user for attribution; stateless client-side history suffices for MVP

---

## Related Code References

- Providers pattern: `app/backend/src/providers/anthropicProvider.js` (extractFields template)
- Route pattern: `app/backend/src/routes/intake.js` (simple POST route with provider)
- Auth pattern: `app/backend/src/middleware/requireAuth.js` (req.user injection)
- Vault access: `app/backend/src/vault.js` (listSops, readSop functions)
- Search logic: `app/backend/src/routes/search.js` (model for tool implementation)
- Record types config: `app/backend/src/config.js` (RECORD_TYPES, directory mappings)
