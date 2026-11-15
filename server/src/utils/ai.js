async function askClaude(system, prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 700, system, messages: [{ role: 'user', content: prompt }] }),
    });
    const d = await r.json();
    return (d.content || []).map((c) => c.text || '').join('').trim() || null;
  } catch (e) { console.error('AI error', e.message); return null; }
}
module.exports = { askClaude };
