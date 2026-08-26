const { getOverdueRecordsForUser, buildDigestHtml } = require('../src/digest');

describe('buildDigestHtml', () => {
  it('reports no overdue records when the list is empty', () => {
    const html = buildDigestHtml('alice', []);
    expect(html).toContain('No overdue records');
  });

  it('lists each overdue record with its type, id, and due date', () => {
    const html = buildDigestHtml('alice', [
      { type: 'sop', id: 'SOP-1', title: 'Widget SOP', review_date: '2020-01-01' },
    ]);
    expect(html).toContain('SOP-1');
    expect(html).toContain('Widget SOP');
    expect(html).toContain('2020-01-01');
  });
});

describe('getOverdueRecordsForUser', () => {
  it('returns an array without throwing even for a user with nothing overdue', () => {
    expect(Array.isArray(getOverdueRecordsForUser('nobody'))).toBe(true);
  });
});
