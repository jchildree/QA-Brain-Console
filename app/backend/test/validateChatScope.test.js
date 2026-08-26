const { validateChatScope } = require('../src/middleware/validateChatScope');

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

describe('validateChatScope', () => {
  it('allows a create when the type is inside the allowed scope', () => {
    const req = { baseUrl: '/api/sops', body: { allowedTypes: ['sops', 'cap'] } };
    const res = mockRes();
    const next = jest.fn();
    validateChatScope(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeNull();
  });

  it('rejects a create when the type is outside the allowed scope', () => {
    const req = { baseUrl: '/api/cap', body: { allowedTypes: ['sops'] } };
    const res = mockRes();
    const next = jest.fn();
    validateChatScope(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'record type not in allowed scope for chat-assisted creation' });
  });

  it('allows any type when allowedTypes is not provided (backward-compat)', () => {
    const req = { baseUrl: '/api/cap', body: {} };
    const res = mockRes();
    const next = jest.fn();
    validateChatScope(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('is a no-op on routes that are not record-create routes (e.g. /api/chat)', () => {
    const req = { baseUrl: '/api/chat', body: { allowedTypes: ['sops'] } };
    const res = mockRes();
    const next = jest.fn();
    validateChatScope(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeNull();
  });
});
