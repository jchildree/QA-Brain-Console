const Anthropic = require('@anthropic-ai/sdk');
const { createAnthropicProvider } = require('./anthropicProvider');
const { createCustomProvider } = require('./customProvider');
const { createCliProvider } = require('./cliProvider');

function getProvider(env = process.env) {
  const kind = env.AI_PROVIDER || 'anthropic';

  if (kind === 'anthropic') {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    return createAnthropicProvider(client);
  }

  if (kind === 'custom') {
    return createCustomProvider(env.CUSTOM_AI_ENDPOINT);
  }

  if (kind === 'cli') {
    return createCliProvider();
  }

  throw new Error(`Unrecognized AI_PROVIDER value: "${kind}" (expected "anthropic", "custom", or "cli")`);
}

module.exports = { getProvider };
