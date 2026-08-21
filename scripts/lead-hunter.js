/**
 * Master Versatile AI Lead Hunter Pipeline (US, India & LinkedIn Integration)
 * File: scripts/lead-hunter.js
 */

const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').replace(/['"]/g, '').trim();
const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').replace(/['"]/g, '').trim();
const APIFY_TOKEN = (process.env.APIFY_TOKEN || '').replace(/['"]/g, '').trim();
const RECIPIENT_EMAIL = (process.env.RECIPIENT_EMAIL || 'er.sheershtiwari@gmail.com').replace(/['"]/g, '').trim();

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

async function sendDigestEmail(qualifiedLeads) {
  if (qualifiedLeads.length === 0) {
    Logger.info('No qualified leads found for today. Email skipped.');
    return;
  }

  const subject = `🚀 Master Lead Digest: ${qualifiedLeads.length} Verified Opportunities Identified`;

  const cardsHtml = qualifiedLeads.map(({ lead, evaluation }) => `
    <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin-bottom: 22px; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <span style="background-color: #0284c7; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 12px;">
          📍 Source: ${lead.source}
        </span>
        <span style="background-color: #10b981; color: #ffffff; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 12px;">
          Score: ${evaluation.score}/100
        </span>
      </div>

      <h3 style="margin: 10px 0; color: #0f172a; font-size: 17px; line-height: 1.4;">${lead.title}</h3>

      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 14px; border-radius: 6px; margin: 12px 0;">
        <span style="font-size: 13px; font-weight: bold; color: #166534;">📬 Contact / Apply Point:</span>
        <span style="font-size: 13px; color: #15803d; font-weight: 500;"> ${evaluation.contactInfo || 'Direct Application Portal / Listing Link'}</span>
      </div>

      <div style="background-color: #f8fafc; padding: 14px; border-left: 4px solid #0284c7; margin: 14px 0; border-radius: 4px;">
        <h4 style="margin: 0 0 6px 0; color: #334155; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">AI Generated Proposal Pitch:</h4>
        <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.5;">${evaluation.pitch}</p>
      </div>

      <p style="margin-top: 16px; margin-bottom: 0;">
        <a href="${lead.url}" target="_blank" rel="noopener noreferrer" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 13px;">View Opportunity →</a>
      </p>
    </div>
  `).join('');

  const fullHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 10px;">
      <div style="background-color: #0f172a; padding: 22px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 21px;">💼 Master AI Lead Hunter Digest</h1>
        <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">Targeting US, Indian & Global Developer Contracts</p>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 14px; color: #334155; margin-bottom: 22px;">
          Identified <strong>${qualifiedLeads.length}</strong> vetted opportunities matching your full-stack capabilities across active job networks.
        </p>
        ${cardsHtml}
      </div>
      <div style="text-align: center; font-size: 12px; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
        Automated Pipeline • Sheersh Tiwari ($20-$30/hr Full-Stack Architect)
      </div>
    </div>
  `;

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
        html: fullHtml
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`Resend API Error: ${payload.message || response.statusText}`);
    }
    Logger.info('Master digest email successfully delivered', { leadCount: qualifiedLeads.length });
    return payload;
  } catch (err) {
    Logger.error('Failed to dispatch master digest email', { error: err.message });
    return null;
  }
}

// Updated LinkedIn Ingestion for Freelance & Contract Roles
async function fetchLinkedInLeads() {
  const leads = [];
  if (!APIFY_TOKEN) {
    Logger.warn('APIFY_TOKEN not found in environment. Skipping LinkedIn fetch.');
    return leads;
  }

  // Contract Filter (f_JT=C) + Remote Filter (f_WT=2) + Freelance Keywords
  const targetKeywords = encodeURIComponent('"Freelance Developer" OR "Contract Full Stack" OR "Freelance Architect" OR "Need Developer"');
  const linkedinSearchUrl = `https://www.linkedin.com/jobs/search/?keywords=${targetKeywords}&f_JT=C&f_WT=2`;

  try {
    const res = await fetch(`https://api.apify.com/v2/acts/curious_coder~linkedin-jobs-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchUrl: linkedinSearchUrl,
        count: 15
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      Logger.warn('Apify LinkedIn fetch failed', { status: res.status, details: errText.slice(0, 150) });
      return leads;
    }

    const jobs = await res.json();
    if (Array.isArray(jobs)) {
      for (const job of jobs) {
        leads.push({
          id: `linkedin_${job.id || Math.random().toString(36).substring(7)}`,
          source: 'LinkedIn (Freelance & Contract)',
          title: `${job.title || 'Freelance Developer'} (${job.companyName || 'Client / Startup'})`,
          body: (job.descriptionText || job.descriptionHtml || job.description || '').replace(/<[^>]*>/g, '').slice(0, 1200),
          url: sanitizeUrl(job.link || job.jobUrl || job.url),
          createdAt: job.postedAt || new Date().toISOString()
        });
      }
    }
    Logger.info('Successfully fetched LinkedIn freelance contract leads', { count: leads.length });
  } catch (err) {
    Logger.error('Error fetching LinkedIn via Apify', { error: err.message });
  }
  return leads;
}

// 2. Remotive API
async function fetchRemotiveLeads() {
  const leads = [];
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=25', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadHunter/4.0' }
    });
    if (!res.ok) return leads;

    const data = await res.json();
    const jobs = data.jobs || [];

    for (const job of jobs) {
      leads.push({
        id: `remotive_${job.id}`,
        source: 'Remotive (US/Global)',
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

// 3. We Work Remotely RSS
async function fetchWWRLeads() {
  const leads = [];
  try {
    const res = await fetch('https://weworkremotely.com/categories/remote-programming-jobs.rss', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadHunter/4.0' }
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

// 4. Hacker News Jobs RSS
async function fetchHackerNewsLeads() {
  const leads = [];
  try {
    const res = await fetch('https://hnrss.org/jobs', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadHunter/4.0' }
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

// 5. RemoteOK Dev RSS
async function fetchRemoteOKLeads() {
  const leads = [];
  try {
    const res = await fetch('https://remoteok.com/remote-dev-jobs.rss', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadHunter/4.0' }
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
        id: `remoteok_${Math.random().toString(36).substring(7)}`,
        source: 'RemoteOK',
        title: title,
        body: description,
        url: sanitizeUrl(rawLink),
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    Logger.error('Error fetching RemoteOK RSS', { error: err.message });
  }
  return leads;
}

// 6. Jobspresso RSS
async function fetchJobspressoLeads() {
  const leads = [];
  try {
    const res = await fetch('https://jobspresso.co/category/software-dev/feed/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadHunter/4.0' }
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
        id: `jobspresso_${Math.random().toString(36).substring(7)}`,
        source: 'Jobspresso',
        title: title,
        body: description,
        url: sanitizeUrl(rawLink),
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    Logger.error('Error fetching Jobspresso RSS', { error: err.message });
  }
  return leads;
}

// AI Evaluation with Contact Extraction
async function evaluateLeadWithGroq(lead) {
  const systemPrompt = `You are an executive AI sales assistant for Sheersh Tiwari ($20-$30/hr), a highly adaptable Full-Stack Developer and Software Architect. Respond strictly in valid JSON format only.`;
  
  const userPrompt = `
  Analyze this job listing from ${lead.source}.

  If RELEVANT (requires web development, mobile apps, full-stack, scripting, APIs, database, or software product work):
  1. Score relevance (0-100).
  2. Draft a 2-sentence tailored proposal pitch highlighting fast and clean execution.
  3. Extract any specific contact email, hiring person, or instructions mentioned in the text (e.g. "Email jobs@company.com" or "Apply via URL").

  If NOT RELEVANT:
  Respond ONLY with JSON: {"relevant": false}

  JSON output format:
  {
    "relevant": true,
    "score": 85,
    "pitch": "...",
    "contactInfo": "Direct Email: contact@company.com / Direct Portal"
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
    } catch (err) {
      // Fallback
    }
  }

  Logger.error('Failed AI evaluation across all models', { leadId: lead.id });
  return { relevant: false };
}

async function runPipeline() {
  const startTime = Date.now();
  Logger.info('Master Pipeline execution initiated');

  if (!GROQ_API_KEY || !RESEND_API_KEY) {
    Logger.error('Missing GROQ_API_KEY or RESEND_API_KEY in environment.');
    process.exit(1);
  }

  const [linkedInLeads, remotiveLeads, wwrLeads, hnLeads, remoteOkLeads, jobspressoLeads] = await Promise.all([
    fetchLinkedInLeads(),
    fetchRemotiveLeads(),
    fetchWWRLeads(),
    fetchHackerNewsLeads(),
    fetchRemoteOKLeads(),
    fetchJobspressoLeads()
  ]);

  const seenUrls = new Set();
  const rawLeads = [];

  for (const lead of [...linkedInLeads, ...remotiveLeads, ...wwrLeads, ...hnLeads, ...remoteOkLeads, ...jobspressoLeads]) {
    if (lead.url && !seenUrls.has(lead.url)) {
      seenUrls.add(lead.url);
      rawLeads.push(lead);
    }
  }

  Logger.info(`Ingested unique dev/freelance listings across all channels`, { count: rawLeads.length });

  if (rawLeads.length === 0) {
    Logger.warn('No listings retrieved.');
    return;
  }

  const qualifiedLeads = [];

  for (const lead of rawLeads) {
    Logger.info(`Evaluating [${lead.id}]`, { source: lead.source, title: lead.title.slice(0, 50) });
    const evaluation = await evaluateLeadWithGroq(lead);

    await sleep(1200);

    if (evaluation.relevant && evaluation.score >= 60) {
      Logger.info(`Qualified Lead [${lead.id}]`, { score: evaluation.score });
      qualifiedLeads.push({ lead, evaluation });
    } else {
      Logger.info(`Skipped [${lead.id}]`, { reason: 'Non-technical or low match score' });
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