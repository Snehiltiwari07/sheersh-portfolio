/**
 * Fully Automated Versatile AI Lead Hunter Pipeline
 * File: scripts/lead-hunter.js
 */

const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').replace(/['"]/g, '').trim();
const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').replace(/['"]/g, '').trim();
const RECIPIENT_EMAIL = (process.env.RECIPIENT_EMAIL || 'er.sheershtiwari@gmail.com').replace(/['"]/g, '').trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Logger = {
  info: (msg, data = {}) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'INFO', message: msg, ...data })),
  warn: (msg, data = {}) => console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'WARN', message: msg, ...data })),
  error: (msg, data = {}) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'ERROR', message: msg, ...data }))
};

// URL Sanitizer to decode HTML entities and guarantee clickable links in Gmail
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

// 1. Fetch Remote Software & Web Development Jobs from Remotive
async function fetchRemotiveLeads() {
  const leads = [];
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=25', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadHunter/3.0' }
    });
    if (!res.ok) return leads;

    const data = await res.json();
    const jobs = data.jobs || [];

    for (const job of jobs) {
      leads.push({
        id: `remotive_${job.id}`,
        source: 'Remotive',
        title: `${job.title} (${job.company_name})`,
        body: (job.description || '').replace(/<[^>]*>/g, '').slice(0, 1200),
        url: sanitizeUrl(job.url),
        createdAt: job.publication_date || new Date().toISOString()
      });
    }
  } catch (err) {
    Logger.error('Error fetching Remotive API', { error: err.message });
  }
  return leads;
}

// 2. Fetch We Work Remotely Programming RSS
async function fetchWWRLeads() {
  const leads = [];
  try {
    const res = await fetch('https://weworkremotely.com/categories/remote-programming-jobs.rss', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadHunter/3.0' }
    });
    if (!res.ok) return leads;

    const xmlText = await res.text();
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<description>(.*?)<\/description>[\s\S]*?<\/item>/gi;

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null && leads.length < 15) {
      const title = match[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim();
      const rawLink = match[2];
      const description = match[3].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim().slice(0, 1200);

      leads.push({
        id: `wwr_${Math.random().toString(36).substring(7)}`,
        source: 'We Work Remotely',
        title: title,
        body: description,
        url: sanitizeUrl(rawLink),
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    Logger.error('Error fetching We Work Remotely RSS', { error: err.message });
  }
  return leads;
}

// 3. Fetch Hacker News Job Listings
async function fetchHackerNewsLeads() {
  const leads = [];
  try {
    const res = await fetch('https://hnrss.org/jobs', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadHunter/3.0' }
    });
    if (!res.ok) return leads;

    const xmlText = await res.text();
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<description>(.*?)<\/description>[\s\S]*?<\/item>/gi;

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null && leads.length < 10) {
      const title = match[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim();
      const rawLink = match[2];
      const description = match[3].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim().slice(0, 1200);

      leads.push({
        id: `hn_${Math.random().toString(36).substring(7)}`,
        source: 'Hacker News Jobs',
        title: title,
        body: description,
        url: sanitizeUrl(rawLink),
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    Logger.error('Error fetching Hacker News RSS', { error: err.message });
  }
  return leads;
}

// Versatile AI Evaluation with Native Groq Models
async function evaluateLeadWithGroq(lead) {
  const systemPrompt = `You are an executive AI sales assistant for Sheersh Tiwari ($20-$30/hr), a highly adaptable Full-Stack Developer and Software Architect. He handles end-to-end development across modern tech stacks: custom websites, SaaS MVPs, mobile/web apps, REST/GraphQL APIs, backend systems, database performance, and automation scripts. You MUST respond strictly in valid JSON format only.`;
  
  const userPrompt = `
  Analyze this listing to see if it requires ANY software development, web creation, mobile app development, scripting, API integration, or technical product building.

  If RELEVANT (any web, app, software, scripting, database, or technical project):
  1. Assign a relevance score (0-100).
  2. Draft a customized, highly persuasive 2-sentence proposal tailored directly to the specific tech or product requested in the job, emphasizing Sheersh's ability to build clean, fast, and scalable solutions.

  If NOT RELEVANT (e.g., non-technical jobs like customer support, sales, accounting, writing, or administrative roles):
  Respond ONLY with JSON: {"relevant": false}

  JSON output format:
  {
    "relevant": true,
    "score": 85,
    "pitch": "..."
  }

  Listing Title: ${lead.title}
  Listing Description: ${lead.body}
  `;

  // Native supported Groq models
  const modelsToTry = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];

  for (const model of modelsToTry) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

      if (response.ok) {
        const data = await response.json();
        return JSON.parse(data.choices[0]?.message?.content || '{}');
      } else {
        const errText = await response.text();
        Logger.warn(`Groq Model [${model}] HTTP ${response.status}`, { details: errText.slice(0, 150) });
      }
    } catch (err) {
      Logger.warn(`Groq Model [${model}] Exception`, { error: err.message });
    }
  }

  Logger.error('Failed AI evaluation across all models', { leadId: lead.id });
  return { relevant: false };
}

async function runPipeline() {
  const startTime = Date.now();
  Logger.info('Versatile Pipeline execution initiated');

  if (!GROQ_API_KEY || !RESEND_API_KEY) {
    Logger.error('Missing GROQ_API_KEY or RESEND_API_KEY in environment.');
    process.exit(1);
  }

  const [remotiveLeads, wwrLeads, hnLeads] = await Promise.all([
    fetchRemotiveLeads(),
    fetchWWRLeads(),
    fetchHackerNewsLeads()
  ]);

  // Deduplicate by URL
  const seenUrls = new Set();
  const rawLeads = [];

  for (const lead of [...remotiveLeads, ...wwrLeads, ...hnLeads]) {
    if (lead.url && !seenUrls.has(lead.url)) {
      seenUrls.add(lead.url);
      rawLeads.push(lead);
    }
  }

  Logger.info(`Ingested unique dev/freelance listings across sources`, { count: rawLeads.length });

  if (rawLeads.length === 0) {
    Logger.warn('No listings retrieved.');
    return;
  }

  let qualifiedCount = 0;

  for (const lead of rawLeads) {
    Logger.info(`Evaluating [${lead.id}]`, { source: lead.source, title: lead.title.slice(0, 50) });
    const evaluation = await evaluateLeadWithGroq(lead);

    // Sleep delay between calls to preserve free-tier request limits
    await sleep(500);

    if (evaluation.relevant && evaluation.score >= 60) {
      qualifiedCount++;
      Logger.info(`Qualified Lead [${lead.id}]`, { score: evaluation.score });

      const emailSubject = `🚀 [Score: ${evaluation.score}] ${lead.source}: ${lead.title.slice(0, 50)}`;
      const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #1a0dab; margin-top: 0;">${lead.title}</h2>
          <p><strong>Source:</strong> ${lead.source} | <strong>Posted:</strong> ${lead.createdAt}</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #0070f3; margin: 15px 0;">
            <h4 style="margin-top: 0; color: #333;">AI Generated Proposal Pitch:</h4>
            <p style="font-size: 15px; color: #222; line-height: 1.5;">${evaluation.pitch}</p>
          </div>
          <p style="margin-top: 20px;">
            <a href="${lead.url}" target="_blank" rel="noopener noreferrer" style="background-color: #0070f3; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Opportunity</a>
          </p>
        </div>
      `;

      await sendEmailAlert(emailSubject, htmlTemplate);
    } else {
      Logger.info(`Skipped [${lead.id}]`, { reason: 'Non-technical or low match score' });
    }
  }

  Logger.info('Pipeline execution finished', {
    processed: rawLeads.length,
    qualified: qualifiedCount,
    durationMs: Date.now() - startTime
  });
}

runPipeline().catch((err) => {
  Logger.error('Unhandled pipeline failure', { error: err.message });
  process.exit(1);
});