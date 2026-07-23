// Contract expected of any in-house/custom AI agent wired in via CUSTOM_AI_ENDPOINT:
// POST { rawText: string, type: string } -> 200 { ...type-specific fields }

function createCustomProvider(endpoint, fetchImpl = fetch) {
  if (!endpoint) {
    throw new Error('CUSTOM_AI_ENDPOINT must be set when AI_PROVIDER=custom');
  }

  async function extractFields(rawText, type = 'sop') {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText, type }),
    });
    if (!res.ok) {
      throw new Error(`Custom AI endpoint returned ${res.status}`);
    }
    return res.json();
  }

  return { extractFields };
}

module.exports = { createCustomProvider };
