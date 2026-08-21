import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Lightweight, instant-rendering SVG vector banners (0ms network load time)
const TECH_BANNERS = {
  leadHunter: (
    <div className="w-full h-full bg-gradient-to-tr from-emerald-950 via-slate-950 to-cyan-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2)_0,transparent_70%)]" />
      <svg className="w-16 h-16 text-emerald-400/50 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    </div>
  ),
  groq: (
    <div className="w-full h-full bg-gradient-to-tr from-orange-950 via-slate-950 to-amber-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.15)_0,transparent_70%)]" />
      <svg className="w-16 h-16 text-orange-500/40 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </div>
  ),
  sheets: (
    <div className="w-full h-full bg-gradient-to-tr from-emerald-950 via-slate-950 to-teal-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0,transparent_70%)]" />
      <svg className="w-16 h-16 text-emerald-500/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3h18v18H3V3zm3 3v4h12V6H6zm0 6v6h5v-6H6zm7 0v6h5v-6h-5z" />
      </svg>
    </div>
  ),
  amex: (
    <div className="w-full h-full bg-gradient-to-tr from-blue-950 via-slate-950 to-indigo-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0,transparent_70%)]" />
      <svg className="w-16 h-16 text-blue-500/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    </div>
  ),
  sql: (
    <div className="w-full h-full bg-gradient-to-tr from-amber-950 via-slate-950 to-yellow-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0,transparent_70%)]" />
      <svg className="w-16 h-16 text-amber-500/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    </div>
  ),
  webgpu: (
    <div className="w-full h-full bg-gradient-to-tr from-cyan-950 via-slate-950 to-sky-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0,transparent_70%)]" />
      <svg className="w-16 h-16 text-cyan-500/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
      </svg>
    </div>
  ),
  kafka: (
    <div className="w-full h-full bg-gradient-to-tr from-violet-950 via-slate-950 to-purple-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0,transparent_70%)]" />
      <svg className="w-16 h-16 text-violet-500/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    </div>
  ),
  gateway: (
    <div className="w-full h-full bg-gradient-to-tr from-pink-950 via-slate-950 to-rose-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.15)_0,transparent_70%)]" />
      <svg className="w-16 h-16 text-pink-500/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </div>
  )
};

const PROJECT_CAROUSEL = [
  {
    id: 'ai-lead-hunter-pipeline',
    title: 'Autonomous AI Lead Hunter & Proposal Pipeline',
    subtitle: 'Multi-Source Lead Harvesting & Auto-Pitching',
    type: 'AI Sales Automation & ETL',
    badge: 'Production Live & Automated',
    badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30',
    banner: TECH_BANNERS.leadHunter,
    description:
      'An autonomous multi-channel lead generation pipeline that scrapes contract listings from LinkedIn, Reddit, Hacker News, RemoteOK, We Work Remotely, and Remotive, evaluates relevance using Groq LPU inference, and dispatches single-digest email briefs with 1-click mailto proposals.',
    metrics: [
      { label: 'Harvest Volume', value: '50+ Jobs/Run' },
      { label: 'Precision Score', value: '75+ Cutoff' },
      { label: 'Execution Speed', value: '< 45 Seconds' }
    ],
    techStack: ['Node.js', 'Groq LPU API', 'Resend API', 'Apify Scraping', 'GitHub Actions', 'RSS/REST'],
    architectureFlow: '6 Multi-Source Endpoints ➔ Groq LPU Evaluation Engine ➔ 1-Click Mailto Proposal Generator ➔ Resend Consolidated Digest',
    deepExplanation:
      'Engineered an autonomous sales engineering worker running scheduled GitHub Actions workflows. It concurrently queries 6 job networks (LinkedIn Apify actor, Reddit JSON/RSS, Hacker News, RemoteOK API, Remotive), evaluates tech stack relevance and budget fit via Groq LPU inference, extracts hiring contact emails, and delivers a consolidated HTML digest with pre-filled proposal links.',
    codeSnippet: `async function runPipeline() {
  // Concurrent Multi-Source Ingestion
  const [reddit, remoteOk, hn, wwr, linkedIn, remotive] = await Promise.all([
    fetchRedditLeads(), fetchRemoteOKLeads(), fetchHackerNewsLeads(),
    fetchWWRLeads(), fetchLinkedInLeads(), fetchRemotiveLeads()
  ]);

  // Groq LPU AI Evaluation & Scoring Loop
  for (const lead of rawLeads) {
    const eval = await evaluateLeadWithGroq(lead);
    if (eval.relevant && eval.score >= 75) {
      qualifiedLeads.push({ lead, eval });
    }
    await sleep(2000); // Enforce Groq rate-limit compliance
  }

  // Dispatch Master Consolidated Digest
  await sendDigestEmail(qualifiedLeads);
}`
  },
  {
    id: 'groq-ai-pipeline',
    title: 'Groq LPU Fast Inference Pipeline',
    subtitle: 'Sub-100ms LLM Integration Gateway',
    type: 'AI System Integration',
    badge: 'Groq LPU Powered',
    badgeColor: 'border-orange-500/40 text-orange-300 bg-orange-950/30',
    banner: TECH_BANNERS.groq,
    description:
      'An enterprise AI integration pipeline leveraging Groq Language Processing Units (LPUs) to execute sub-100ms token generation for real-time document analysis and automated chat responses.',
    metrics: [
      { label: 'Latency', value: '< 95ms' },
      { label: 'Throughput', value: '500+ TPS' },
      { label: 'Model', value: 'Llama 3.1 8B' }
    ],
    techStack: ['Groq LPU API', 'Python FastAPI', 'Java Spring Boot', 'Redis Cache', 'React.js'],
    architectureFlow: 'User Payload ➔ Spring Gateway ➔ Python FastAPI Agent ➔ Groq LPU Hardware Acceleration ➔ Streaming SSE Response',
    deepExplanation:
      'Interfaced directly with Groq LPU API endpoints using async HTTP connection pooling and SSE (Server-Sent Events) streaming. Response payloads are cached in Redis using vector embeddings to eliminate duplicate LLM inference calls.',
    codeSnippet: `@app.post("/api/v1/ai/summarize")
async def summarize_document(request: DocumentRequest):
    # Groq LPU Accelerator Async Client Dispatch
    response = await groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": request.text}],
        temperature=0.2,
        max_tokens=350
    )
    return {"summary": response.choices[0].message.content, "engine": "Groq LPU"}`
  },
  {
    id: 'amex-resy-gateway',
    title: 'Amex Payment & POS Integration',
    subtitle: 'Hospitality Payment & POS Gateway',
    type: 'Fintech & Payment Integration',
    badge: 'Amex PCI-DSS Gateway',
    badgeColor: 'border-blue-500/40 text-blue-300 bg-blue-950/30',
    banner: TECH_BANNERS.amex,
    description:
      'Integrated American Express (Amex) direct card-present and online payment tokenization with Point-of-Sale (POS) reservation webhooks, ensuring PCI-DSS compliance and zero double-billing.',
    metrics: [
      { label: 'Settle Latency', value: '< 180ms' },
      { label: 'Compliance', value: 'PCI-DSS L1' },
      { label: 'Uptime', value: '99.999%' }
    ],
    techStack: ['Java Spring Boot', 'Amex Gateway API', 'POS Webhooks', 'PostgreSQL', 'Redis Lock'],
    architectureFlow: 'POS Terminal ➔ Spring Boot Gateway ➔ Redis Distributed Lock ➔ Amex Direct API ➔ Idempotent DB Commit',
    deepExplanation:
      'Engineered a payment reconciliation middleware connecting POS hardware with American Express host APIs. Distributed Redis locks prevent double-charge race conditions during peak dining hours, while webhook retry queues handle tokenized settlement captures.',
    codeSnippet: `@PostMapping("/api/v1/payments/amex/authorize")
public ResponseEntity<PaymentResult> authorizeAmexTransaction(@Valid @RequestBody PaymentRequest request) {
    // Acquire Redis Idempotency Lock
    String lockKey = "lock:payment:" + request.getIdempotencyKey();
    if (!redisTemplate.opsForValue().setIfAbsent(lockKey, "LOCKED", Duration.ofSeconds(10))) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(PaymentResult.duplicate("Duplicate Request"));
    }

    AmexAuthResponse response = amexClient.executeAuthorization(request.toAmexPayload());
    return ResponseEntity.ok(PaymentResult.fromAmex(response));
}`
  },
  {
    id: 'sheets-sync-engine',
    title: 'Google Sheets Bi-Directional Sync Gateway',
    subtitle: 'Automated ETL & Database Webhook Gateway',
    type: 'System Integration & Webhooks',
    badge: 'Google API Sync',
    badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30',
    banner: TECH_BANNERS.sheets,
    description:
      'A bi-directional data synchronization pipeline that links Google Sheets with PostgreSQL databases in real time, handling OAuth2 token rotation, conflict resolution, and batch webhooks.',
    metrics: [
      { label: 'Sync Delay', value: '< 450ms' },
      { label: 'Data Accuracy', value: '100%' },
      { label: 'OAuth2 SLA', value: 'Auto-Rotate' }
    ],
    techStack: ['Java Spring Boot', 'Google Sheets API v4', 'PostgreSQL', 'Webhooks', 'OAuth2'],
    architectureFlow: 'Google Sheets Webhook ➔ Spring Boot Listener ➔ OAuth2 Token Refresher ➔ Postgres Upsert Transaction',
    deepExplanation:
      'Engineered an event-driven listener using Google Sheets API v4 batch-update endpoints. When spreadsheet cells edit, an AppScript webhook fires a payload to a Spring Boot microservice, which executes idempotent PostgreSQL INSERT ON CONFLICT queries.',
    codeSnippet: `@Service
public class GoogleSheetsSyncService {

    public BatchUpdateValuesResponse syncRowToPostgres(String spreadsheetId, List<Object> rowData) {
        Sheets service = googleSheetsClient.getSheetsService();
        ValueRange body = new ValueRange().setValues(Collections.singletonList(rowData));

        return service.spreadsheets().values()
            .update(spreadsheetId, "A1:Z1", body)
            .setValueInputOption("USER_ENTERED")
            .execute();
    }
}`
  },
  {
    id: 'query-cortex',
    title: '200M+ Record SQL Optimization Engine',
    subtitle: 'High-Cardinality Query Tuning & Execution Refactoring',
    type: 'Database Architecture & Tuning',
    badge: 'Beacon Award Winner',
    badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/30',
    banner: TECH_BANNERS.sql,
    description:
      'A database architectural overhaul that slashed cross-module search query times across 200M+ SQL records from 15 minutes down to 6 seconds while reducing server CPU load by 92%.',
    metrics: [
      { label: 'Execution Time', value: '15m ➔ 6s' },
      { label: 'CPU Reduction', value: '-92%' },
      { label: 'Dataset Size', value: '200M+ Rows' }
    ],
    techStack: ['PostgreSQL', 'Oracle SQL', 'Java Spring Boot', 'B-Tree Indexing', 'Stored Procedures'],
    architectureFlow: 'Heavy Unindexed Table Scan ➔ Query Plan Tree Analysis ➔ B-Tree Composite Indexing ➔ Set-Based Stored Proc',
    deepExplanation:
      'Analyzed PostgreSQL EXPLAIN ANALYZE execution trees to identify thread starvation caused by sequential table scans across nested joins. Re-engineered row-by-row procedural cursors into set-based operations and applied high-cardinality composite B-Tree covering indexes.',
    codeSnippet: `-- B-Tree Composite Covering Index DDL
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sample_records_covering
ON sample_records (status, created_at DESC)
INCLUDE (sample_id, test_code, patient_id)
WHERE is_deleted IS FALSE;

-- EXPLAIN ANALYZE Summary:
-- Result: Index Only Scan on idx_sample_records_covering
-- Heap Fetches: 0 | Total Execution Time: 6.012 ms`
  },
  {
    id: 'local-cortex',
    title: 'LocalCortex WebGPU Studio',
    subtitle: 'In-Browser WebGPU Client-Side AI Runtime',
    type: 'Full-Stack WebGPU AI App',
    badge: 'Client-Side Local AI',
    badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30',
    banner: TECH_BANNERS.webgpu,
    description:
      'A WebGPU-powered web application that compiles and executes quantized Open-Source Large Language Models directly inside client browsers with zero external server dependencies or API costs.',
    metrics: [
      { label: 'Cloud Cost', value: '$0 / Month' },
      { label: 'Data Privacy', value: '100% Offline' },
      { label: 'Inference Speed', value: '120+ TPS' }
    ],
    techStack: ['React.js', 'WebGPU (WGSL)', 'WebAssembly (WASM)', 'Tailwind CSS', 'Framer Motion'],
    architectureFlow: 'Browser WASM Memory ➔ WebGPU WGSL Compute Shaders ➔ Local GPU Tensor Core Matrix Multiplication ➔ Token Stream',
    deepExplanation:
      'Leverages WebGPU compute shaders written in WGSL to offload matrix-vector multiplications directly onto client graphics hardware. Model weights are loaded into WebAssembly memory buffers, offering complete data privacy for local document queries.',
    codeSnippet: `// WGSL Compute Shader Matrix Multiplication Kernel
@group(0) @binding(0) var<storage, read> matrixA : array<f32>;
@group(0) @binding(1) var<storage, read> matrixB : array<f32>;
@group(0) @binding(2) var<storage, read_write> matrixC : array<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id : vec3<u32>) {
    let row = id.x;
    let col = id.y;
    var sum = 0.0;
    for (var k = 0u; k < 64u; k = k + 1u) {
        sum += matrixA[row * 64u + k] * matrixB[k * 64u + col];
    }
    matrixC[row * 64u + col] = sum;
}`
  },
  {
    id: 'telemetry-gateway',
    title: 'High-Throughput Telemetry Event Gateway',
    subtitle: 'Asynchronous Stream Ingestion Pipeline',
    type: 'System Integration & Middleware',
    badge: 'Kafka Event Gateway',
    badgeColor: 'border-violet-500/40 text-violet-300 bg-violet-950/30',
    banner: TECH_BANNERS.kafka,
    description:
      'An asynchronous data ingestion gateway that parses, validates, and routes raw IoT and API outputs directly into core microservice databases.',
    metrics: [
      { label: 'Daily Throughput', value: '5M+ Events' },
      { label: 'P99 Latency', value: '< 18ms' },
      { label: 'Data Loss', value: '0 Packets' }
    ],
    techStack: ['Python FastAPI', 'Apache Kafka', 'Java Spring Boot', 'AWS S3', 'Docker'],
    architectureFlow: 'Hardware / API ➔ Python FastAPI Receiver ➔ Kafka Topic Partition ➔ Spring Worker Group ➔ AWS S3 / PostgreSQL',
    deepExplanation:
      'High-velocity telemetry data is ingested via lightweight Python FastAPI endpoints, which serialize binary and CSV streams into Apache Kafka partitions. Spring Boot consumer groups process messages asynchronously using Dead-Letter Queues (DLQ).',
    codeSnippet: `@app.post("/api/v1/telemetry/ingest")
async def ingest_instrument_stream(payload: TelemetryPayload):
    # Asynchronous Kafka Topic Event Dispatch
    kafka_producer.send(
        topic="telemetry.raw.v1",
        key=payload.device_id.encode('utf-8'),
        value=payload.json().encode('utf-8')
    )
    return {"status": "ACKNOWLEDGED", "device_id": payload.device_id}`
  },
  {
    id: 'stream-gate',
    title: 'StreamGate Microservice Gateway',
    subtitle: 'Distributed API Rate Limiter & Circuit Breaker',
    type: 'Distributed Microservices Integration',
    badge: 'Microservice Gateway',
    badgeColor: 'border-pink-500/40 text-pink-300 bg-pink-950/30',
    banner: TECH_BANNERS.gateway,
    description:
      'An API gateway integration layer designed to rate-limit incoming web traffic, protect backend microservices from burst overloads, and provide automated circuit breaking.',
    metrics: [
      { label: 'Max Capacity', value: '50K RPS' },
      { label: 'Overhead', value: '< 1.2ms' },
      { label: 'Uptime', value: '99.99%' }
    ],
    techStack: ['Spring Cloud Gateway', 'Redis Token Bucket', 'Docker', 'AWS EC2', 'Prometheus'],
    architectureFlow: 'Client Requests ➔ Spring Cloud Gateway ➔ Redis Token Bucket Evaluator ➔ Circuit Breaker ➔ Microservice Worker',
    deepExplanation:
      'Utilizes a Redis-backed Token Bucket algorithm to manage request quotas per API key across gateway instances. When downstream services exceed operational thresholds, Resilience4j circuit breakers trip automatically.',
    codeSnippet: `@Bean
public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
    return builder.routes()
        .route("microservice_route", r -> r.path("/api/v2/analytics/**")
            .filters(f -> f.requestRateLimiter(c -> c
                .setRateLimiter(redisRateLimiter())
                .setKeyResolver(userKeyResolver())))
            .uri("lb://ANALYTICS-SERVICE"))
        .build();
}`
  }
];

export default function Projects({ onOpenHireDrawer }) {
  const [activeSpec, setActiveSpec] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef(null);

  // Smooth Automatic Carousel Auto-Scroll (3.5 Second Interval)
  useEffect(() => {
    if (isPaused || activeSpec) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const cardWidth = 380;

        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused, activeSpec]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="projects" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 shadow-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            8 Systems, AI Pipelines & Sales Automations
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-slate-100 tracking-tight">
            Featured Systems Showcase
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-sans leading-relaxed">
            Auto-rotating showcase featuring autonomous AI lead pipelines, Groq LPU inference, Amex Card POS gateways, Google Sheets ETL syncs, and 200M+ SQL refactors. Hover to pause auto-scroll.
          </p>
        </div>

        {/* Carousel Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => scroll('left')}
            className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/50 text-slate-300 hover:text-white transition-all cursor-pointer shadow-xl active:scale-95 font-mono text-sm"
            aria-label="Scroll left"
          >
            ← Previous
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/50 text-slate-300 hover:text-white transition-all cursor-pointer shadow-xl active:scale-95 font-mono text-sm"
            aria-label="Scroll right"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Auto-Playing Horizontal Carousel */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-none snap-x snap-mandatory focus:outline-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {PROJECT_CAROUSEL.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="snap-start shrink-0 w-[88vw] sm:w-[380px] md:w-[410px] rounded-3xl bg-slate-950/90 border border-slate-800/90 hover:border-violet-500/50 flex flex-col justify-between transition-all duration-300 shadow-2xl backdrop-blur-xl relative group overflow-hidden"
          >
            {/* Top Project Vector Banner */}
            <div className="relative h-40 sm:h-44 w-full overflow-hidden border-b border-slate-900">
              {project.banner}

              {/* Badge Overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-200 uppercase tracking-wider bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/80 backdrop-blur-md">
                  {project.type}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-semibold backdrop-blur-md ${project.badgeColor}`}>
                  {project.badge}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {project.title}
                  </h3>
                  <p className="font-mono text-xs text-violet-400 mt-0.5">
                    {project.subtitle}
                  </p>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed font-sans line-clamp-3">
                  {project.description}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 font-mono">
                  {project.metrics.map((m) => (
                    <div key={m.label} className="text-center">
                      <div className="text-[9px] text-slate-400">{m.label}</div>
                      <div className="text-xs font-bold text-slate-100 mt-0.5">{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Tech Pills & Actions */}
              <div className="pt-4 border-t border-slate-900 space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setActiveSpec(project)}
                    className="flex-1 py-2.5 rounded-xl font-mono text-xs font-bold text-center text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/50 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>📋 Inspect Spec</span>
                  </button>
                  <button
                    onClick={onOpenHireDrawer}
                    className="px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold text-violet-300 bg-violet-950/40 border border-violet-800/60 hover:bg-violet-900/60 transition-colors cursor-pointer"
                  >
                    💼 Scope
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Deep Architectural Spec Modal */}
      <AnimatePresence>
        {activeSpec && (
          <DetailedArchitectureModal
            project={activeSpec}
            onClose={() => setActiveSpec(null)}
            onOpenHireDrawer={onOpenHireDrawer}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

{/* Detailed Architecture Modal Component */}
function DetailedArchitectureModal({ project, onClose, onOpenHireDrawer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between"
      >
        {/* Header Image Cover */}
        <div className="relative h-32 sm:h-36 w-full bg-slate-900 shrink-0 border-b border-slate-800">
          {project.banner}

          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer backdrop-blur-md"
            >
              ✕
            </button>
          </div>

          <div className="absolute bottom-4 left-6 right-6">
            <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider block">
              {project.type} Specification
            </span>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-100">
              {project.title}
            </h3>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 font-sans">

          {/* Pipeline Data Flow */}
          <div className="space-y-1.5">
            <h4 className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pipeline Data Flow
            </h4>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 leading-relaxed">
              {project.architectureFlow}
            </div>
          </div>

          {/* Deep Architectural Explanation */}
          <div className="space-y-1.5">
            <h4 className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Deep Architectural Specification
            </h4>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              {project.deepExplanation}
            </p>
          </div>

          {/* Implementation Code Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="font-bold text-slate-400 uppercase">Production Snippet</span>
              <span className="text-slate-500">Source Code</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
              <pre><code>{project.codeSnippet}</code></pre>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 font-mono">
            {project.metrics.map((m) => (
              <div key={m.label} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">{m.label}</span>
                <span className="text-sm font-bold text-emerald-400 block mt-0.5">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0 font-mono">
          <button
            onClick={() => {
              onClose();
              onOpenHireDrawer();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            💼 Scope Similar System
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            Close Spec
          </button>
        </div>
      </motion.div>
    </div>
  );
}