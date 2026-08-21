const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function run() {
  console.log('--- STARTING LEAD HUNTER ---');
  
  if (!GROQ_API_KEY || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ Error: Missing environment secrets! Verify GROQ_API_KEY, TELEGRAM_BOT_TOKEN, and TELEGRAM_CHAT_ID in GitHub Secrets.');
    return;
  }

  console.log('Fetching latest Reddit posts...');
  const res = await fetch('https://www.reddit.com/r/forhire/new.json?limit=25', {
    headers: { 'User-Agent': 'LeadHunter/1.0' }
  });
  const data = await res.json();
  const rawPosts = data.data?.children || [];
  console.log(`Fetched ${rawPosts.length} total posts from Reddit.`);

  const hiringPosts = rawPosts
    .map(c => c.data)
    .filter(p => p.title && p.title.toLowerCase().includes('hiring'));

  console.log(`Found ${hiringPosts.length} posts containing "hiring" in title.`);

  if (hiringPosts.length === 0) {
    console.log('No hiring posts found in this run. Waiting for next schedule.');
    return;
  }

  for (const lead of hiringPosts) {
    console.log(`Analyzing: "${lead.title}"...`);
    const prompt = `
    You are an AI sales agent for Sheersh Tiwari ($20-$25/hr Full-Stack Architect).
    Analyze this post. If relevant to SQL, Spring Boot, React, FastAPI, or Database optimization, draft a 2-sentence proposal highlighting his 200M+ SQL record query optimization win.
    Otherwise, respond ONLY with "SKIP".

    Title: ${lead.title}
    Body: ${lead.selftext || ''}
    `;

    try {
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
        console.log('✅ Qualified lead found! Sending Telegram notification...');
        const text = `🚨 *NEW REDDIT LEAD*\n\n*Title:* ${lead.title}\n\n*AI Pitch:* ${pitch}\n\n[View Job Details](https://reddit.com${lead.permalink})`;
        
        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' })
        });
        const tgData = await tgRes.json();
        console.log('Telegram API Response:', tgData);
      } else {
        console.log('Skipped (not relevant to your skill stack).');
      }
    } catch (err) {
      console.error('Error processing lead:', err.message);
    }
  }
  console.log('--- LEAD HUNTER COMPLETED ---');
}

run();