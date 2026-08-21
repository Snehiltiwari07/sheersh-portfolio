const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    })
  });
  return await res.json();
}

async function run() {
  console.log('=== STARTING AUTOMATED AI LEAD HUNTER ===');

  // 1. Verify Secrets
  if (!GROQ_API_KEY || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ CRITICAL ERROR: Missing GitHub Secrets!');
    console.error(`GROQ_API_KEY present: ${!!GROQ_API_KEY}`);
    console.error(`TELEGRAM_BOT_TOKEN present: ${!!TELEGRAM_BOT_TOKEN}`);
    console.error(`TELEGRAM_CHAT_ID present: ${!!TELEGRAM_CHAT_ID}`);
    return;
  }

  // 2. Send Startup Test Ping
  console.log('📡 Testing Telegram connection...');
  const ping = await sendTelegram('🟢 *Lead Hunter Active!*\nScanning Reddit & Hacker News for contract opportunities.');
  console.log('Telegram Test Status:', ping.ok ? 'SUCCESS ✅' : `FAILED ❌ (${ping.description})`);

  // 3. Fetch Reddit Posts
  console.log('🔍 Fetching [/r/forhire] listings...');
  let redditLeads = [];
  try {
    const res = await fetch('https://www.reddit.com/r/forhire/new.json?limit=25', {
      headers: { 'User-Agent': 'LeadHunterBot/1.0' }
    });
    const data = await res.json();
    const rawPosts = data.data?.children || [];
    
    redditLeads = rawPosts
      .map(c => c.data)
      .filter(p => p.title && p.title.toLowerCase().includes('hiring'))
      .map(p => ({
        source: 'Reddit',
        title: p.title,
        body: p.selftext || '',
        url: `https://reddit.com${p.permalink}`
      }));
    console.log(`Found ${redditLeads.length} Reddit hiring posts.`);
  } catch (err) {
    console.error('❌ Error fetching Reddit:', err.message);
  }

  // 4. Fetch Hacker News RSS Listings
  console.log('🔍 Fetching Hacker News [Seeking Freelancer] RSS...');
  let hnLeads = [];
  try {
    const res = await fetch('https://hnrss.org/whoishiring/freelance?q=SEEKING+FREELANCER');
    const xmlText = await res.text();
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<description>(.*?)<\/description>[\s\S]*?<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null && hnLeads.length < 5) {
      hnLeads.push({
        source: 'Hacker News',
        title: match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        body: match[3].replace(/<!\[CDATA\[|\]\]>/g, '').trim().slice(0, 500),
        url: match[2].trim()
      });
    }
    console.log(`Found ${hnLeads.length} Hacker News listings.`);
  } catch (err) {
    console.error('❌ Error fetching Hacker News:', err.message);
  }

  const allLeads = [...redditLeads, ...hnLeads];
  console.log(`Total listings to evaluate: ${allLeads.length}`);

  if (allLeads.length === 0) {
    console.log('No hiring posts found in this cycle.');
    return;
  }

  // 5. Evaluate Opportunities via Groq
  for (const lead of allLeads) {
    console.log(`🤖 Evaluating (${lead.source}): "${lead.title.slice(0, 50)}..."`);
    
    const prompt = `
    You are an AI sales agent for Sheersh Tiwari ($20-$25/hr Full-Stack Architect).
    Analyze this post. If relevant to SQL performance tuning, Spring Boot, React, FastAPI, Python, or Microservices, draft a 2-sentence proposal highlighting his 200M+ SQL record query optimization win.
    Otherwise, respond ONLY with the word "SKIP".

    Source: ${lead.source}
    Title: ${lead.title}
    Body: ${lead.body}
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
        console.log('✨ QUALIFIED LEAD! Dispatching to Telegram...');
        const msg = `🚨 *NEW ${lead.source.toUpperCase()} LEAD*\n\n*Title:* ${lead.title}\n\n*AI Pitch:* ${pitch}\n\n[View Job Details](${lead.url})`;
        const tgResult = await sendTelegram(msg);
        console.log('Dispatch Status:', tgResult.ok ? 'SUCCESS ✅' : `FAILED ❌ (${tgResult.description})`);
      } else {
        console.log('⏩ Skipped (not relevant).');
      }
    } catch (err) {
      console.error('❌ Error evaluating lead:', err.message);
    }
  }

  console.log('=== LEAD HUNTER RUN COMPLETE ===');
}

run();
