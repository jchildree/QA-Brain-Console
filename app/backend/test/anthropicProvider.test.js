const { createAnthropicProvider } = require('../src/providers/anthropicProvider');

function makeFakeClient(responseText) {
  return {
    messages: {
      create: async () => ({ content: [{ type: 'text', text: responseText }] }),
    },
  };
}

describe('anthropicProvider.extractFields', () => {
  it('parses the JSON response from the Claude client', async () => {
    const fakeClient = makeFakeClient(JSON.stringify({
      department: 'QC',
      tags: ['ph-meter', 'calibration'],
      purpose: 'Calibrate the pH meter before each shift.',
      scope: 'QC lab, all pH meters.',
    }));
    const provider = createAnthropicProvider(fakeClient);

    const result = await provider.extractFields('Raw note about calibrating the pH meter every shift in QC.');

    expect(result).toEqual({
      department: 'QC',
      tags: ['ph-meter', 'calibration'],
      purpose: 'Calibrate the pH meter before each shift.',
      scope: 'QC lab, all pH meters.',
    });
  });

  it('strips a markdown code fence before parsing', async () => {
    const fakeClient = makeFakeClient('```json\n{"department":"QA","tags":[],"purpose":"p","scope":"s"}\n```');
    const provider = createAnthropicProvider(fakeClient);
    const result = await provider.extractFields('some text');
    expect(result).toEqual({ department: 'QA', tags: [], purpose: 'p', scope: 's' });
  });

  it('throws a clear error on non-JSON response', async () => {
    const fakeClient = makeFakeClient('sorry, I cannot help with that');
    const provider = createAnthropicProvider(fakeClient);
    await expect(provider.extractFields('some text')).rejects.toThrow(/non-JSON/);
  });

  it('asks for CAP-specific fields when type is cap', async () => {
    let capturedArgs;
    const fakeClient = {
      messages: {
        create: async (args) => {
          capturedArgs = args;
          return { content: [{ type: 'text', text: JSON.stringify({ root_cause: 'x' }) }] };
        },
      },
    };
    const provider = createAnthropicProvider(fakeClient);
    await provider.extractFields('some cap note', 'cap');
    expect(capturedArgs.messages[0].content).toContain('root_cause');
  });

  it('always asks for title, status, and related_documents regardless of type', async () => {
    let capturedArgs;
    const fakeClient = {
      messages: {
        create: async (args) => {
          capturedArgs = args;
          return { content: [{ type: 'text', text: '{}' }] };
        },
      },
    };
    const provider = createAnthropicProvider(fakeClient);
    await provider.extractFields('some text');
    expect(capturedArgs.messages[0].content).toContain('title');
    expect(capturedArgs.messages[0].content).toContain('default to Draft');
    expect(capturedArgs.messages[0].content).toContain('related_documents');
  });
});
