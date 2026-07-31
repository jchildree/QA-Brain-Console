const { createCliProvider } = require('../src/providers/cliProvider');

describe('cliProvider.extractFields', () => {
  it('sends the prompt to the runner and parses the JSON response', async () => {
    let capturedPrompt;
    const runner = async (prompt) => {
      capturedPrompt = prompt;
      return JSON.stringify({ department: 'QC', tags: [], purpose: 'p', scope: 's' });
    };
    const provider = createCliProvider(runner);

    const result = await provider.extractFields('Raw note about calibrating the pH meter.');

    expect(capturedPrompt).toContain('Raw note about calibrating the pH meter.');
    expect(capturedPrompt).toContain('SOP');
    expect(result).toEqual({ department: 'QC', tags: [], purpose: 'p', scope: 's' });
  });

  it('always asks for title, status, and related_documents regardless of type', async () => {
    let capturedPrompt;
    const runner = async (prompt) => {
      capturedPrompt = prompt;
      return JSON.stringify({});
    };
    const provider = createCliProvider(runner);

    await provider.extractFields('some text');

    expect(capturedPrompt).toContain('title');
    expect(capturedPrompt).toContain('default to Draft');
    expect(capturedPrompt).toContain('default to "v1"');
    expect(capturedPrompt).toContain('related_documents');
  });

  it('asks for CAP-specific fields when type is cap', async () => {
    let capturedPrompt;
    const runner = async (prompt) => {
      capturedPrompt = prompt;
      return JSON.stringify({ root_cause: 'x' });
    };
    const provider = createCliProvider(runner);

    await provider.extractFields('some cap note', 'cap');

    expect(capturedPrompt).toContain('root_cause');
    expect(capturedPrompt).toContain('CAP');
  });

  it('strips a markdown code fence before parsing', async () => {
    const runner = async () => '```json\n{"department":"QA","tags":[],"purpose":"p","scope":"s"}\n```';
    const provider = createCliProvider(runner);
    const result = await provider.extractFields('some text');
    expect(result).toEqual({ department: 'QA', tags: [], purpose: 'p', scope: 's' });
  });

  it('throws a clear error on non-JSON response', async () => {
    const runner = async () => 'sorry, I cannot help with that';
    const provider = createCliProvider(runner);
    await expect(provider.extractFields('some text')).rejects.toThrow(/non-JSON/);
  });
});
