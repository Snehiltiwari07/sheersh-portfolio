// Original project catalogue. Presentation lives in Portfolio.jsx.
export const PROJECT_CAROUSEL = [
  {
    id: 'ai-lead-hunter-pipeline',
    title: 'Autonomous AI Lead Hunter & Proposal Pipeline',
    subtitle: 'Multi-Source Lead Harvesting & Auto-Pitching',
    type: 'AI Sales Automation & ETL',
    badge: 'Production Live & Automated',
    badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30',    description:
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
    badgeColor: 'border-orange-500/40 text-orange-300 bg-orange-950/30',    description:
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
    badgeColor: 'border-blue-500/40 text-blue-300 bg-blue-950/30',    description:
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
    badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30',    description:
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
    badge: 'Employee of the Year 2024',
    badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/30',    description:
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
-- Heap Fetches: 0 | Total Execution Time: 6012 ms`
  },
  {
    id: 'local-cortex',
    title: 'LocalCortex WebGPU Studio',
    subtitle: 'In-Browser WebGPU Client-Side AI Runtime',
    type: 'Full-Stack WebGPU AI App',
    badge: 'Client-Side Local AI',
    badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30',    description:
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
    badgeColor: 'border-violet-500/40 text-violet-300 bg-violet-950/30',    description:
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
    badgeColor: 'border-pink-500/40 text-pink-300 bg-pink-950/30',    description:
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

