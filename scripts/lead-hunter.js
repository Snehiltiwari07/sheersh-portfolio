/**
 * Production AI Lead Hunter (Multi-Source RSS Pipeline)
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'er.sheershtiwari@gmail.com';

// 24-hour lookback window
const LOOKBACK_WINDOW_MS = 24 * 60 * 60 * 1000;

const Logger = {
  info: (msg, data = {}) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'INFO', message: msg, ...data })),
  warn: (msg, data = {}) => console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'WARN', message: msg, ...data })),
  error: (msg, data = {}) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'ERROR', message: msg, ...data }))
};

async function sendEmailAlert(subject, htmlBody) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Lead Hunter Pipeline <onboarding@resend.dev>',
        to: [RECIPIENT_EMAIL],
        subject: subject,
        html: htmlBody
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`Resend API Error: ${payload.message || response.statusText}`);
    }
    return payload;
  } catch (err) {
    Logger.error('Failed to dispatch email notification', { error: err.message });
    return null;
  }
}

// 1. Reddit RSS Feeds (Bypasses 403 JSON Cloud IP Block)
async function fetchRedditLeads() {
  const subreddits = ['forhire', 'freelance_forhire', 'reactjs'];
  const leads = [];
  const now = Date.now();

  for (const sub of subreddits) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/new.rss`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });

      if (!res.ok) {
        Logger.warn(`Reddit sub /r/${sub} returned status ${res.status}`);
        continue;
      }

      const xmlText = await res.text();
      const entryRegex = /<entry>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link href="(.*?)"[\s\S]*?<updated>(.*?)<\/updated>[\s\S]*?<content type="html">(.*?)<\/content>[\s\S]*?<\/entry>/g;

      let match;
      while ((match = entryRegex.exec(xmlText)) !== null) {
        const title = match[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
        const url = match[2];
        const updatedTime = new Date(match[3]).getTime();
        const content = match[4].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/<[^>]*>/g, '').trim();

        if (now - updatedTime > LOOKBACK_WINDOW_MS) continue;

        const isHiring = title.toLowerCase().includes('[hiring]') || title.toLowerCase().includes('hiring');

        if (isHiring) {
          leads.push({
            id: `reddit_${updatedTime}_${Math.random().toString(36).substring(7)}`,
            source: `Reddit (/r/${sub})`,
            title: title,
            body: content.slice(0, 1000),
            url: url,
            createdAt: new Date(updatedTime).toISOString()
          });
        }
      }
    } catch (err) {
      Logger.error(`Error fetching Reddit sub /r/${sub}`, { error: err.message });
    }
  }
  return leads;
}

// 2. Hacker News RSS Feed
async function fetchHackerNewsLeads() {
  const leads = [];
  try {
    const res = await fetch('https://hnrss.org/whoishiring/freelance?q=SEEKING+FREELANCER');
    if (!res.ok) return leads;

    const xmlText = await res.text();
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<description>(.*?)<\/description>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/g;

    let match;
    const now = Date.now();

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const pubDate = new Date(match[4]).getTime();
      if (now - pubDate > LOOKBACK_WINDOW_MS) continue;

      leads.push({
        id: `hn_${pubDate}`,
        source: 'Hacker News',
        title: match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        body: match[3].replace(/<!\[CDATA\[|\]\]>/g, '').trim().slice(0, 1000),
        url: match[2].trim(),
        createdAt: new Date(pubDate).toISOString()
      });
    }
  } catch (err) {
    Logger.error('Error fetching Hacker News RSS', { error: err.message });
  }
  return leads;
}

async function evaluateLeadWithGroq(lead) {
  const prompt = `
  You are an executive sales AI for Sheersh Tiwari ($20-$25/hr Full-Stack Architect).
  Target Stack: Java, Spring Boot, Python, FastAPI, React, SQL performance tuning, and Microservices.

  Analyze this client post.
  If the job is seeking a developer in his stack:
  1. Score relevance (0-100).
  2. Write a 2-sentence cold proposal referencing his 200M+ record SQL optimization milestone.

  If NOT relevant, respond ONLY with JSON: {"relevant": false}

  JSON output format:
  {
    "relevant": true,
    "score": 92,
    "pitch": "..."
  }

  Post Title: ${lead.title}
  Post Body: ${lead.body}
  `;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0]?.message?.content || '{}');
  } catch (err) {
    Logger.error('Failed AI evaluation', { leadId: lead.id, error: err.message });
    return { relevant: false };
  }
}

async function runPipeline() {
  const startTime = Date.now();
  Logger.info('Pipeline execution initiated');

  if (!GROQ_API_KEY || !RESEND_API_KEY) {
    Logger.error('Environment validation failed. Missing GROQ_API_KEY or RESEND_API_KEY.');
    process.exit(1);
  }

  const [redditLeads, hnLeads] = await Promise.all([
    fetchRedditLeads(),
    fetchHackerNewsLeads()
  ]);

  const rawLeads = [...redditLeads, ...hnLeads];
  Logger.info(`Ingested raw leads within 24-hour window`, { count: rawLeads.length });

  let qualifiedCount = 0;

  for (const lead of rawLeads) {
    Logger.info(`Evaluating lead [${lead.id}]`, { source: lead.source, title: lead.title.slice(0, 45) });
    const evaluation = await evaluateLeadWithGroq(lead);

    if (evaluation.relevant && evaluation.score >= 70) {
      qualifiedCount++;
      Logger.info(`Lead qualified [${lead.id}]`, { score: evaluation.score });

      const emailSubject = `🚨 [Score: ${evaluation.score}] ${lead.source}: ${lead.title.slice(0, 50)}...`;
      const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #1a0dab; margin-top: 0;">${lead.title}</h2>
          <p><strong>Source:</strong> ${lead.source} | <strong>Posted:</strong> ${lead.createdAt}</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #0070f3; margin: 15px 0;">
            <h4 style="margin-top: 0; color: #333;">Generated Proposal Pitch:</h4>
            <p style="font-size: 15px; color: #222; line-height: 1.5;">${evaluation.pitch}</p>
          </div>
          <p style="margin-top: 20px;">
            <a href="${lead.url}" style="background-color: #0070f3; color: white; padding: 10px 18px; text-decoration: none; border-radius: 5px; display: inline-block;">View Original Listing</a>
          </p>
        </div>
      `;

      await sendEmailAlert(emailSubject, htmlTemplate);
    }
  }

  Logger.info('Pipeline execution finished', {
    processed: rawLeads.length,
    qualified: qualifiedCount,
    durationMs: Date.now() - startTime
  });
}

runPipeline().catch((err) => {
  Logger.error('Unhandled pipeline failure', { error: err.message, stack: err.stack });
  process.exit(1);
});