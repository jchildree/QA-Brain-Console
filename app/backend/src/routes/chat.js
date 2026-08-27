const express = require('express');

function buildTools(recordTypes) {
  return [
    {
      name: 'search',
      description: 'Search vault records',
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
    {
      name: 'readRecord',
      description: 'Read a specific record',
      input_schema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: Object.keys(recordTypes) },
          filename: { type: 'string' },
        },
        required: ['type', 'filename'],
      },
    },
  ];
}

// The Anthropic SDK returns a raw message with a `content` array of blocks;
// the cli/custom providers already return { text, toolUse? }. Normalize both
// to the same shape so the endpoint's response contract is provider-agnostic.
function normalize(result) {
  if (!Array.isArray(result?.content)) return result;
  const textBlock = result.content.find((b) => b.type === 'text');
  const toolBlock = result.content.find((b) => b.type === 'tool_use');
  const normalized = { text: textBlock ? textBlock.text : '' };
  if (toolBlock) normalized.toolUse = { name: toolBlock.name, input: toolBlock.input };
  return normalized;
}

function isValidHistory(messages) {
  if (messages === undefined) return true;
  if (!Array.isArray(messages)) return false;
  return messages.every(
    (m) => m && typeof m === 'object' && typeof m.role === 'string' && typeof m.content === 'string'
  );
}

function createChatRouter(provider, recordTypes) {
  const router = express.Router();
  const tools = buildTools(recordTypes);

  router.post('/chat', async (req, res) => {
    const { message, messages } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (!isValidHistory(messages)) {
      return res.status(400).json({ error: 'messages must be an array of { role, content } pairs' });
    }

    const history = [...(messages || []), { role: 'user', content: message }];

    try {
      const result = await provider.chat(history, tools);
      res.json(normalize(result));
    } catch (err) {
      res.status(502).json({ error: 'AI chat failed', detail: err.message });
    }
  });

  return router;
}

module.exports = { createChatRouter };
