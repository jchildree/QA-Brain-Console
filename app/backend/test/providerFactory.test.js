const { getProvider } = require('../src/providers');

describe('getProvider', () => {
  it('returns an Anthropic-backed provider when AI_PROVIDER is unset (default)', () => {
    const provider = getProvider({ AI_PROVIDER: undefined, ANTHROPIC_API_KEY: 'test-key' });
    expect(typeof provider.extractFields).toBe('function');
  });

  it('returns a custom provider when AI_PROVIDER=custom', () => {
    const provider = getProvider({ AI_PROVIDER: 'custom', CUSTOM_AI_ENDPOINT: 'http://localhost:9999/extract' });
    expect(typeof provider.extractFields).toBe('function');
  });

  it('returns a CLI-backed provider when AI_PROVIDER=cli (no API key required)', () => {
    const provider = getProvider({ AI_PROVIDER: 'cli' });
    expect(typeof provider.extractFields).toBe('function');
  });

  it('throws a clear error for an unrecognized AI_PROVIDER value', () => {
    expect(() => getProvider({ AI_PROVIDER: 'bogus' })).toThrow(/AI_PROVIDER/);
  });
});
