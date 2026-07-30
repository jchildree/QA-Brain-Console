const { FIELD_SCHEMAS, UNIVERSAL_FIELDS } = require('../fieldSchemas');

function createAnthropicProvider(client) {
  async function extractFields(rawText, type = 'sop') {
    const schema = FIELD_SCHEMAS[type] || FIELD_SCHEMAS.sop;
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Extract ${type.toUpperCase()} frontmatter fields from this raw text. Return ONLY valid JSON with keys: ${UNIVERSAL_FIELDS}, ${schema}. Raw text:\n\n${rawText}`,
        },
      ],
    });
    const textBlock = message.content.find((block) => block.type === 'text');
    const raw = textBlock.text.trim();
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonText = fenced ? fenced[1] : raw;
    try {
      return JSON.parse(jsonText);
    } catch (err) {
      throw new Error(`Claude returned non-JSON response: ${err.message}`);
    }
  }

  return { extractFields };
}

module.exports = { createAnthropicProvider };
