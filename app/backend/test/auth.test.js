const { createSessionToken, verifySessionToken } = require('../src/auth');

describe('createSessionToken / verifySessionToken', () => {
  const secret = 'test-secret';

  it('round-trips a freshly created token', () => {
    const token = createSessionToken(secret, { username: 'alice' });
    expect(verifySessionToken(token, secret)).toBe('alice');
  });

  it('rejects a token signed with a different secret', () => {
    const token = createSessionToken('other-secret', { username: 'alice' });
    expect(verifySessionToken(token, secret)).toBe(false);
  });

  it('rejects a tampered token', () => {
    const token = createSessionToken(secret, { username: 'alice' });
    const tampered = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a');
    expect(verifySessionToken(tampered, secret)).toBe(false);
  });

  it('rejects an expired token', () => {
    const token = createSessionToken(secret, {
      username: 'alice',
      now: Date.now() - 1000 * 60 * 60 * 25,
      ttlMs: 1000 * 60 * 60 * 24,
    });
    expect(verifySessionToken(token, secret)).toBe(false);
  });

  it('rejects a token with no username', () => {
    const token = createSessionToken(secret, {});
    expect(verifySessionToken(token, secret)).toBe(false);
  });
});
