const { spawn } = require('child_process');
const { FIELD_SCHEMAS, UNIVERSAL_FIELDS } = require('../fieldSchemas');

function defaultRunner(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`claude CLI exited with code ${code}: ${stderr.trim()}`));
        return;
      }
      resolve(stdout);
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

function createCliProvider(runner = defaultRunner) {
  async function extractFields(rawText, type = 'sop') {
    const schema = FIELD_SCHEMAS[type] || FIELD_SCHEMAS.sop;
    const prompt = `Extract ${type.toUpperCase()} frontmatter fields from this raw text. Return ONLY valid JSON with keys: ${UNIVERSAL_FIELDS}, ${schema}. Raw text:\n\n${rawText}`;
    const raw = (await runner(prompt)).trim();
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonText = fenced ? fenced[1] : raw;
    try {
      return JSON.parse(jsonText);
    } catch (err) {
      throw new Error(`Claude CLI returned non-JSON response: ${err.message}`);
    }
  }

  async function chat(messages = [], tools = []) {
    const toolsDesc = tools.length
      ? `Available tools:\n${tools.map((t) => `- ${t.name}: ${t.description}`).join('\n')}\n\nTo call a tool, respond with a fenced code block: \`\`\`tool_call\n{"name": "toolName", "input": {...}}\n\`\`\`\n\n`
      : '';
    const transcript = messages.map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`).join('\n\n');
    const prompt = `${toolsDesc}${transcript}`;
    const raw = (await runner(prompt)).trim();
    const toolMatch = raw.match(/```tool_call\s*([\s\S]*?)\s*```/);
    if (toolMatch) {
      try {
        const parsed = JSON.parse(toolMatch[1]);
        return { text: raw.replace(toolMatch[0], '').trim(), toolUse: { name: parsed.name, input: parsed.input } };
      } catch {
        // fall through to plain text if the tool_call block isn't valid JSON
      }
    }
    return { text: raw };
  }

  return { extractFields, chat };
}

module.exports = { createCliProvider };
