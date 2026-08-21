const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function fetchRedditLeads() {
  try {
    const res = await fetch('https://www.reddit.com/r/forhire/new.json?limit=5', {
      headers: { 'User-Agent': 'LeadHunter/1.0' }
    });
    const data = await res.json();
    return (data.data?.children || [])
      .map(c => c.data)
      .filter(p => p.title && p.title.toLowerCase().includes('[hiring]'))
      .map(p => ({
        source: 'Reddit',
        title: p.title,
        body: p.selftext || '',
        url: `https://reddit.com${p.permalink}`
      }));
  } catch (err) {
    return [];
  }
}

async function run() {
  const leads = await fetchRedditLeads();

  for (const lead of leads) {
    const prompt = `
    You are an AI sales agent for Sheersh Tiwari ($20-$25/hr Full-Stack Architect).
    Analyze this post. If relevant to SQL, Spring Boot, React, FastAPI, or Database optimization, draft a 2-sentence proposal highlighting his 200M+ SQL record query optimization win.
    Otherwise, respond ONLY with "SKIP".
    
    Title: ${lead.title}
    Body: ${lead.body}
    `;

    const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const aiData = await aiRes.json();
    const pitch = aiData.choices?.[0]?.message?.content?.trim();

    if (pitch && !pitch.includes('SKIP')) {
      const text = `🚨 *NEW ${lead.source.toUpperCase()} LEAD*\n\n*Title:* ${lead.title}\n\n*AI Pitch:* ${pitch}\n\n[View Job Details](${lead.url})`;
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' })
      });
    }
  }
}

run();