/**
 * Master Versatile AI Lead Hunter Pipeline (Production Hardened)
 * File: scripts/lead-hunter.js
 */

const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').replace(/['"]/g, '').trim();
const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').replace(/['"]/g, '').trim();
const APIFY_TOKEN = (process.env.APIFY_TOKEN || '').replace(/['"]/g, '').trim();
const RECIPIENT_EMAIL = (process.env.RECIPIENT_EMAIL || 'er.sheershtiwari@gmail.com').replace(/['"]/g, '').trim();

const PORTFOLIO_LINK = 'https://sheershtiwari.vercel.app';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Logger = {
  info: (msg, data = {}) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'INFO', message: msg, ...data })),
  warn: (msg, data = {}) => console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'WARN', message: msg, ...data })),
  error: (msg, data = {}) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'ERROR', message: msg, ...data }))
};

function sanitizeUrl(rawUrl) {
  if (!rawUrl) return '#';
  let clean = rawUrl
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  return clean;
}

// 1. Reddit /r/forhire (Graceful Fail-Safe)
async function fetchRedditLeads() {
  const leads = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://www.reddit.com/r/forhire/new.json?limit=15', {
      headers: { 'User-Agent': 'node:lead-hunter-pipeline:v5.0 (by /u/sheershtiwari)' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      Logger.warn('Reddit API rate-limited or blocked. Skipping Reddit gracefully.', { status: res.status });
      return leads;
    }

    const data = await res.json();
    const posts = data?.data?.children || [];

    for (const post of posts) {
      const p = post.data;
      if (p.title && p.title.toLowerCase().includes('[hiring]')) {
        leads.push({
          id: `reddit_${p.id}`,
          source: 'Reddit (/r/forhire)',
          title: p.title,
          body: (p.selftext || p.title).slice(0, 1200),
          url: sanitizeUrl(`https://www.reddit.com${p.permalink}`),
          createdAt: new Date((p.created_utc || Date.now() / 1000) * 1000).toISOString()
        });
      }
    }
    Logger.info('Fetched Reddit /r/forhire leads', { count: leads.length });
  } catch (err) {
    Logger.warn('Reddit fetch skipped due to timeout/error', { error: err.message });
  }
  return leads;
}

// 2. RemoteOK API (Strict Tech Title Regex)
async function fetchRemoteOKLeads() {
  const leads = [];
  const techRegex = /developer|engineer|programmer|architect|full stack|fullstack|backend|frontend|react|node|python|java|sql|devops|software|web/i;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadHunter/5.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      Logger.warn('RemoteOK API fetch failed', { status: res.status });
      return leads;
    }

    const data = await res.json();
    const jobs = Array.isArray(data) ? data.slice(1) : [];

    for (const job of jobs) {
      const position = job.position || '';
      if (techRegex.test(position) && job.url) {
        leads.push({
          id: `remoteok_${job.id || Math.random().toString(36).substring(7)}`,
          source: 'RemoteOK',
          title: `${position} (${job.company || 'Company'})`,
          body: (job.description || '').replace(/<[^>]*>/g, '').slice(0, 1200),
          url: sanitizeUrl(job.url),
          createdAt: job.date || new Date().toISOString()
        });
      }
      if (leads.length >= 10) break;
    }
    Logger.info('Fetched RemoteOK tech leads', { count: leads.length });
  } catch (err) {
    Logger.warn('RemoteOK fetch skipped due to error', { error: err.message });
  }
  return leads;
}

// 3. Hacker News Jobs RSS (Timeout Handled)
async function fetchHackerNewsLeads() {
  const leads = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://hnrss.org/jobs', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadHunter/5.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      Logger.warn('Hacker News fetch failed', { status: res.status });
      return leads;
    }

    const xmlText = await res.text();
    const itemBlocks = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];

    for (const itemXml of itemBlocks.slice(0, 15)) {
      const titleMatch = itemXml.match(/<title>(.*?)<\/title>/i);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/i);
      const descMatch = itemXml.match(/<description>(.*?)<\/description>/i);

      if (titleMatch && linkMatch) {
        const title = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim();
        const url = linkMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        const description = descMatch ? descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim().slice(0, 1200) : title;

        leads.push({
          id: `hn_${Math.random().toString(36).substring(7)}`,
          source: 'Hacker News Jobs',
          title: title,
          body: description,
          url: sanitizeUrl(url),
          createdAt: new Date().toISOString()
        });
      }
    }
    Logger.info('Fetched Hacker News leads', { count: leads.length });
  } catch (err) {
    Logger.warn('Hacker News fetch skipped due to network timeout', { error: err.message });
  }
  return leads;
}

// 4. We Work Remotely RSS
async function fetchWWRLeads() {
  const leads = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://weworkremotely.com/categories/remote-programming-jobs.rss', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadHunter/5.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return leads;

    const xmlText = await res.text();
    const itemBlocks = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];

    for (const itemXml of itemBlocks.slice(0, 15)) {
      const titleMatch = itemXml.match(/<title>(.*?)<\/title>/i);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/i);
      const descMatch = itemXml.match(/<description>(.*?)<\/description>/i);

      if (titleMatch && linkMatch) {
        const title = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim();
        const url = linkMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        const description = descMatch ? descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim().slice(0, 1200) : title;

        leads.push({
          id: `wwr_${Math.random().toString(36).substring(7)}`,
          source: 'We Work Remotely',
          title: title,
          body: description,
          url: sanitizeUrl(url),
          createdAt: new Date().toISOString()
        });
      }
    }
    Logger.info('Fetched We Work Remotely leads', { count: leads.length });
  } catch (err) {
    Logger.warn('We Work Remotely fetch skipped', { error: err.message });
  }
  return leads;
}

// 5. Apify LinkedIn Scraper
async function fetchLinkedInLeads() {
  const leads = [];
  if (!APIFY_TOKEN) return leads;

  try {
    const targetKeywords = encodeURIComponent('"Freelance Developer" OR "Contract Full Stack" OR "Need Developer"');
    const res = await fetch(`https://api.apify.com/v2/acts/curious_coder~linkedin-jobs-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchUrl: `https://www.linkedin.com/jobs/search/?keywords=${targetKeywords}&f_JT=C&f_WT=2`,
        count: 10
      })
    });

    if (!res.ok) return leads;

    const jobs = await res.json();
    if (Array.isArray(jobs)) {
      for (const job of jobs) {
        leads.push({
          id: `linkedin_${job.id || Math.random().toString(36).substring(7)}`,
          source: 'LinkedIn (Contract)',
          title: `${job.title || 'Freelance Developer'} (${job.companyName || 'Client / Startup'})`,
          body: (job.descriptionText || job.descriptionHtml || job.description || '').replace(/<[^>]*>/g, '').slice(0, 1200),
          url: sanitizeUrl(job.link || job.jobUrl || job.url),
          createdAt: job.postedAt || new Date().toISOString()
        });
      }
    }
    Logger.info('Fetched LinkedIn contract leads via Apify', { count: leads.length });
  } catch (err) {
    Logger.warn('LinkedIn fetch skipped', { error: err.message });
  }
  return leads;
}

// 6. Remotive API
async function fetchRemotiveLeads() {
  const leads = [];
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=20', {
      headers: { 'User-Agent': 'Mozilla/5.0 LeadHunter/5.0' }
    });
    if (!res.ok) return leads;

    const data = await res.json();
    for (const job of data.jobs || []) {
      leads.push({
        id: `remotive_${job.id}`,
        source: 'Remotive',
        title: `${job.title} (${job.company_name})`,
        body: (job.description || '').replace(/<[^>]*>/g, '').slice(0, 1200),
        url: sanitizeUrl(job.url),
        createdAt: job.publication_date || new Date().toISOString()
      });
    }
    Logger.info('Fetched Remotive API leads', { count: leads.length });
  } catch (err) {
    Logger.warn('Remotive fetch skipped', { error: err.message });
  }
  return leads;
}

// AI Evaluation
async function evaluateLeadWithGroq(lead) {
  const systemPrompt = `You are an executive AI sales assistant for Sheersh Tiwari ($30-$50/hr), a Full-Stack Developer and Architect specializing in React, Node, Python, Java, APIs, and SQL performance optimization. Respond strictly in valid JSON format only.`;
  
  const userPrompt = `
  Analyze this listing from ${lead.source}.

  If RELEVANT (software building, web creation, APIs, app development, database optimization, or scripting):
  1. Score relevance (0-100). Focus on high-value contract potential.
  2. Draft a persuasive 2-sentence proposal pitch referencing fast, scalable execution and his portfolio (${PORTFOLIO_LINK}).
  3. Extract direct email addresses or contact instructions if present in text (e.g. "contact@company.com"). If none, set "contactEmail": null.

  If NOT RELEVANT:
  Respond ONLY with JSON: {"relevant": false}

  JSON output format:
  {
    "relevant": true,
    "score": 85,
    "pitch": "...",
    "contactEmail": "client@example.com",
    "contactInfo": "Direct Email: client@example.com / Apply via Portal"
  }

  Listing Title: ${lead.title}
  Listing Description: ${lead.body}
  `;

  const modelsToTry = ['openai/gpt-oss-20b', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'];

  for (const model of modelsToTry) {
    try {
      let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (response.status === 429) {
        Logger.warn(`Groq Model [${model}] rate limited. Cooling down 3s...`);
        await sleep(3000);
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' }
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        return JSON.parse(data.choices[0]?.message?.content || '{}');
      }
    } catch (err) {}
  }

  return { relevant: false };
}

// Master Digest Dispatcher
async function sendDigestEmail(qualifiedLeads) {
  if (qualifiedLeads.length === 0) {
    Logger.info('No qualified leads above score threshold. Email skipped.');
    return;
  }

  const subject = `🚀 High-Value Lead Digest: ${qualifiedLeads.length} Qualified Contracts Identified`;

  const cardsHtml = qualifiedLeads.map(({ lead, evaluation }) => {
    const mailtoButton = evaluation.contactEmail ? `
      <a href="mailto:${evaluation.contactEmail}?subject=${encodeURIComponent(`Proposal: ${lead.title}`)}&body=${encodeURIComponent(`${evaluation.pitch}\n\nPortfolio: ${PORTFOLIO_LINK}`)}"
         style="background-color: #10b981; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 13px; margin-right: 10px;">
        ✉️ 1-Click Email Client →
      </a>
    ` : '';

    return `
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin-bottom: 22px; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
          <span style="background-color: #0284c7; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 12px;">
            📍 ${lead.source}
          </span>
          <span style="background-color: #059669; color: #ffffff; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 12px;">
            Score: ${evaluation.score}/100
          </span>
        </div>

        <h3 style="margin: 10px 0; color: #0f172a; font-size: 17px; line-height: 1.4;">${lead.title}</h3>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 14px; border-radius: 6px; margin: 12px 0;">
          <span style="font-size: 13px; font-weight: bold; color: #166534;">📬 Contact Point:</span>
          <span style="font-size: 13px; color: #15803d; font-weight: 500;"> ${evaluation.contactInfo || 'Direct Application Link'}</span>
        </div>

        <div style="background-color: #f8fafc; padding: 14px; border-left: 4px solid #0284c7; margin: 14px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 6px 0; color: #334155; font-size: 12px; text-transform: uppercase;">Generated Proposal Pitch:</h4>
          <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.5;">${evaluation.pitch}</p>
        </div>

        <p style="margin-top: 16px; margin-bottom: 0;">
          ${mailtoButton}
          <a href="${lead.url}" target="_blank" rel="noopener noreferrer" style="background-color: #2563eb; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 13px;">View Opportunity →</a>
        </p>
      </div>
    `;
  }).join('');

  const fullHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 10px;">
      <div style="background-color: #0f172a; padding: 22px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 21px;">💼 Master AI Lead Hunter Digest</h1>
        <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">High-Value Remote Contracts ($30-$50+/hr)</p>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 14px; color: #334155; margin-bottom: 22px;">
          Identified <strong>${qualifiedLeads.length}</strong> top-tier freelance opportunities matching your technical stack.
        </p>
        ${cardsHtml}
      </div>
    </div>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Lead Hunter Pipeline <onboarding@resend.dev>',
        to: [RECIPIENT_EMAIL],
        subject: subject,
        html: fullHtml
      })
    });
    Logger.info('Master digest delivered successfully', { count: qualifiedLeads.length });
  } catch (err) {
    Logger.error('Failed to dispatch digest email', { error: err.message });
  }
}

async function runPipeline() {
  const startTime = Date.now();
  Logger.info('Master Pipeline execution initiated');

  if (!GROQ_API_KEY || !RESEND_API_KEY) {
    Logger.error('Missing GROQ_API_KEY or RESEND_API_KEY.');
    process.exit(1);
  }

  const [redditLeads, remoteOkLeads, hnLeads, wwrLeads, linkedInLeads, remotiveLeads] = await Promise.all([
    fetchRedditLeads(),
    fetchRemoteOKLeads(),
    fetchHackerNewsLeads(),
    fetchWWRLeads(),
    fetchLinkedInLeads(),
    fetchRemotiveLeads()
  ]);

  const seenUrls = new Set();
  const rawLeads = [];

  for (const lead of [...redditLeads, ...remoteOkLeads, ...hnLeads, ...wwrLeads, ...linkedInLeads, ...remotiveLeads]) {
    if (lead.url && !seenUrls.has(lead.url)) {
      seenUrls.add(lead.url);
      rawLeads.push(lead);
    }
  }

  Logger.info(`Ingested unique dev listings across multi-source feeds`, { count: rawLeads.length });

  const qualifiedLeads = [];

  for (const lead of rawLeads) {
    Logger.info(`Evaluating [${lead.id}]`, { source: lead.source, title: lead.title.slice(0, 50) });
    const evaluation = await evaluateLeadWithGroq(lead);

    await sleep(2000);

    if (evaluation.relevant && evaluation.score >= 75) {
      Logger.info(`Qualified Lead [${lead.id}]`, { score: evaluation.score });
      qualifiedLeads.push({ lead, evaluation });
    } else {
      Logger.info(`Skipped [${lead.id}]`, { reason: 'Below 75 score threshold or non-technical' });
    }
  }

  await sendDigestEmail(qualifiedLeads);

  Logger.info('Master Pipeline execution finished', {
    processed: rawLeads.length,
    qualified: qualifiedLeads.length,
    durationMs: Date.now() - startTime
  });
}

runPipeline().catch((err) => {
  Logger.error('Unhandled pipeline failure', { error: err.message });
  process.exit(1);
});