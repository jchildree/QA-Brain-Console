const { createCustomProvider } = require('../src/providers/customProvider');

describe('customProvider.extractFields', () => {
  it('POSTs rawText to the configured endpoint and returns the parsed fields', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ department: 'IT', tags: ['x'], purpose: 'p', scope: 's' }),
    });
    const provider = createCustomProvider('http://localhost:9999/extract', fakeFetch);

    const result = await provider.extractFields('raw text');

    expect(fakeFetch).toHaveBeenCalledWith('http://localhost:9999/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: 'raw text', type: 'sop' }),
    });
    expect(result).toEqual({ department: 'IT', tags: ['x'], purpose: 'p', scope: 's' });
  });

  it('includes the record type in the POST body when given', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ root_cause: 'x' }) });
    const provider = createCustomProvider('http://localhost:9999/extract', fakeFetch);
    await provider.extractFields('raw text', 'cap');
    expect(fakeFetch).toHaveBeenCalledWith(
      'http://localhost:9999/extract',
      expect.objectContaining({ body: JSON.stringify({ rawText: 'raw text', type: 'cap' }) })
    );
  });

  it('throws when no endpoint is configured', () => {
    expect(() => createCustomProvider(undefined, vi.fn())).toThrow(/CUSTOM_AI_ENDPOINT/);
  });

  it('throws a clear error when the endpoint responds with a non-2xx status', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const provider = createCustomProvider('http://localhost:9999/extract', fakeFetch);
    await expect(provider.extractFields('raw text')).rejects.toThrow(/500/);
  });
});
