export const searchPages = [
  {
    path: '/services/ai-workflow-automation', kind: 'service', serviceId: '01', label: 'AI workflows',
    title: 'AI Workflow Automation & Internal Tools | Sheersh Tiwari',
    description: 'Work with Sheersh Tiwari on AI workflows, agent control interfaces, and internal tools with human review, clear failure states, and practical handover.',
    heading: 'AI workflows built around the work.',
    summary: 'I build AI workflows and internal tools for teams dealing with repeated research, disconnected information, and manual handoffs. I’m Sheersh Tiwari, an independent engineer in Indore, India, working remotely.',
    facts: ['AI workflows & internal tools', 'Human review and control', 'Independent engineering / Remote'],
    sections: [
      { title: 'Start with one useful workflow', paragraphs: ['A good first brief names the repeated task, the information it needs, and the person who checks the result. We identify the slow or unreliable step before choosing a model or adding agents.'], items: ['Research gathered into a reviewable workspace.', 'An assistant connected to a defined set of information and tools.', 'A task interface that makes status, errors, and human decisions visible.'] },
      { title: 'What I can deliver', paragraphs: ['The scope can include model integration, backend endpoints, a usable interface, review states, and documentation. We agree on the acceptance criteria before expanding the workflow.'], items: ['A focused first version around a real task.', 'Explicit loading, unavailable, and failure states.', 'Review or approval points where a person needs to decide.', 'Configuration notes and a practical handover.'] },
      { title: 'Relevant work: कामCREW', paragraphs: ['I built कामCREW, a Next.js and TypeScript control center around the Hermes agent runtime. It brings tasks, conversations, model configuration, and research into one workspace with pause and resume controls.', 'Hermes supplies the agent runtime; my work is the control layer and its integration. This is an independent build, not a claim of commercial customers or measured business savings.'], link: '/work/kaamcrew', linkLabel: 'Read the कामCREW case study' },
      { title: 'How an engagement starts', paragraphs: ['Share the task you repeat, the systems involved, and any data-access constraints. We define a small usable version, review it against the brief, and decide what to refine. DeepSeek, vector-database retrieval, MCP, and agent evaluations are current exploration areas; they are scoped separately from delivered capabilities.'] },
    ],
    faqs: [
      ['Do I need multiple AI agents?', 'Not necessarily. We start with the task and use the simplest workflow that meets the brief. A model integration or a conventional automation may be sufficient.'],
      ['How do you handle private business information?', 'Before implementation, we agree on what information is needed, who can access it, and which providers may process it. The integration and hosting choices follow those requirements; no particular compliance certification is implied.'],
      ['What does an AI workflow cost?', 'Pricing depends on the integrations, interface, hosting, review requirements, and acceptance criteria. Send a description of the workflow for a scoped discussion; there is no fixed price or delivery promise on this page.'],
    ], related: ['/work/kaamcrew', '/services/custom-software'],
  },
  {
    path: '/services/custom-software', kind: 'service', serviceId: '02', label: 'Custom software',
    title: 'Custom Software & API Integration Developer | Sheersh Tiwari',
    description: 'Custom web applications, backend APIs, dashboards, and system integrations from Sheersh Tiwari, an independent full-stack engineer working remotely from India.',
    heading: 'Software that fits your process.',
    summary: 'I build custom web applications, backend APIs, and integrations for teams whose existing tools do not fit the way they work. The focus is a useful interface backed by dependable data flow.',
    facts: ['Web applications & dashboards', 'Backend APIs & integrations', 'React / Java / Python'],
    sections: [
      { title: 'Connect the tools you already use', paragraphs: ['An integration has to handle more than a successful request. Authentication, changes in source data, retries, and conflicting updates all affect whether people can rely on it.'], items: ['Internal dashboards and task interfaces.', 'REST or GraphQL API development and integration.', 'Data synchronization between a web application, database, and third-party service.'] },
      { title: 'Choose the stack around the constraints', paragraphs: ['My work spans React, Next.js, TypeScript, Java Spring Boot, Python, PostgreSQL, and MySQL. Existing infrastructure, maintainability, and the people taking over the system guide the choice.', 'The portfolio includes a Google Sheets and PostgreSQL synchronization gateway, booking and financial integrations, and the कामCREW control interface. These are examples of the kinds of boundaries I work across, rather than a promise that every integration is interchangeable.'] },
      { title: 'A scoped build, with a clear handover', items: ['Clarify the users, inputs, outputs, and systems involved.', 'Define the API contract and smallest useful interface.', 'Build and review a working version against agreed scenarios.', 'Document configuration, operation, and remaining limitations.'], paragraphs: ['We agree on what is included and who will maintain it. Ongoing support can be discussed as part of that scope.'] },
      { title: 'An example of a connected interface', paragraphs: ['कामCREW connects a Next.js interface to the Hermes gateway and SQLite-backed task state, using server-sent events for live updates. The case study explains the boundaries between my control layer and the underlying runtime.'], link: '/work/kaamcrew', linkLabel: 'Explore the कामCREW architecture' },
    ],
    faqs: [
      ['Can you work with an existing application?', 'Yes. Start by sharing the stack, the change needed, and how the current system is operated. We can then assess the affected interfaces and define a limited first scope.'],
      ['Do you build both the interface and backend?', 'Yes. My work covers React and Next.js interfaces, Java or Python backends, APIs, and relational databases. The specific stack follows the project requirements.'],
      ['Can you guarantee a delivery date before reviewing the system?', 'A useful estimate needs the requirements, dependencies, and access constraints. We agree on scope and acceptance criteria before making a delivery commitment.'],
    ], related: ['/work/kaamcrew', '/services/database-optimization'],
  },
  {
    path: '/services/database-optimization', kind: 'service', serviceId: '03', label: 'Database performance',
    title: 'SQL Query Optimization & Database Performance | Sheersh Tiwari',
    description: 'SQL query tuning, execution-plan analysis, indexing, and backend performance work. Explore Sheersh Tiwari’s portfolio-reported optimization across 200M+ records.',
    heading: 'Find the bottleneck. Measure the improvement.',
    summary: 'I help investigate slow SQL queries and backend data paths, then compare changes against a measured baseline. My work includes query refactoring, indexing, and database-backed application performance.',
    facts: ['SQL & execution plans', 'PostgreSQL / MySQL', 'Measured before and after'],
    sections: [
      { title: 'When a performance review is useful', paragraphs: ['A report that takes minutes, an endpoint that times out, or a query that degrades as records grow is a concrete starting point. The investigation follows the actual workload rather than assuming that more infrastructure is the answer.'], items: ['Review representative slow queries and execution plans.', 'Examine join patterns, filters, scans, and index usage.', 'Check the application path and data-transfer overhead.', 'Compare changes under documented, representative conditions.'] },
      { title: 'What the work produces', paragraphs: ['We define the affected queries and acceptance criteria first. The deliverable can include query or indexing changes, the measurements used to compare them, rollout considerations, and documentation for the team operating the database.', 'Performance changes need validation against realistic data and application behavior. A result from one workload is not a guaranteed speedup for another.'] },
      { title: 'Relevant work: a 200M+ record system', paragraphs: ['My portfolio reports work on an anonymized US life-sciences lab-informatics platform: reducing a cross-module query from 15 minutes to 6 seconds, with 92% lower CPU load. The case study separates these reported outcomes from what can be publicly inspected.'], link: '/work/sql-performance', linkLabel: 'Read the SQL performance case study' },
      { title: 'What to bring to the first discussion', items: ['The slow query, report, or endpoint and its typical response time.', 'Database engine and approximate table sizes.', 'A sanitized execution plan or representative schema if sharing is permitted.', 'Operational constraints, maintenance windows, and the desired outcome.'] },
    ],
    faqs: [
      ['Can you optimize PostgreSQL and MySQL queries?', 'Both are part of my database work. The first step is reviewing the engine, schema, query plans, and workload so the engagement targets a specific bottleneck.'],
      ['Will you need production data?', 'We agree on the least information and access required. Sanitized schemas, execution plans, and representative test data may be sufficient for an initial review. Production access is not assumed.'],
      ['Will my query become as fast as your case study?', 'That cannot be promised. The outcome depends on the query, data distribution, schema, indexes, infrastructure, and workload. We establish a baseline and measure the actual result.'],
    ], related: ['/work/sql-performance', '/services/custom-software'],
  },
  {
    path: '/work/kaamcrew', kind: 'case-study', label: 'कामCREW case study',
    title: 'कामCREW: AI Agent Control Center Case Study | Sheersh Tiwari',
    description: 'How Sheersh Tiwari built कामCREW, a Next.js and TypeScript control center around Hermes with task visibility, agent conversations, live updates, and human controls.',
    heading: 'कामCREW: a working home for an AI team.',
    summary: 'कामCREW is my independent 2026 build: a control center around the Hermes agent runtime. I built the web control layer to bring tasks, conversations, model settings, and research into one workspace.',
    facts: ['Independent build / 2026', 'Next.js / TypeScript / SQLite', 'Built on the Hermes runtime'],
    sections: [
      { title: 'The problem', paragraphs: ['Agent work can be difficult to follow when task status, conversations, configuration, and research live in separate places. A person needs enough context to understand the state of the work and decide when to intervene.'] },
      { title: 'My contribution', paragraphs: ['I built the Next.js and TypeScript control interface and the server routes that connect it to the Hermes gateway and task state. The workspace brings the task board, agent conversations, model configuration, and research workflows together.', 'Hermes provides the agent runtime. I did not invent that runtime; my contribution is the control center built around it.'] },
      { title: 'How the pieces connect', items: ['Next.js and TypeScript provide the interface and control layer.', 'Server routes connect to the Hermes gateway.', 'SQLite-backed state supports the task board.', 'Server-sent events bring live work updates into the interface.', 'Pause and resume controls give the operator a way to intervene.'] },
      { title: 'What makes the interface useful', paragraphs: ['The goal is to show what is actually happening. Tasks and conversations can be reviewed together, connection failures are represented as failures, and model settings are accessible in the same workspace.', 'This makes the control boundaries visible: the operator uses the interface, the server routes connect to state and the gateway, and Hermes performs the underlying agent work.'] },
      { title: 'Current scope and limitations', paragraphs: ['This is an independent engineering project, not an established commercial SaaS case study. No paying-customer count, revenue, measured time savings, or public live-demo URL is claimed.', 'DeepSeek, vector-database retrieval, MCP, and agent evaluations are areas I am exploring. They should not be read as completed कामCREW capabilities unless a later implementation documents them.'], link: '/services/ai-workflow-automation', linkLabel: 'Discuss a similar AI workflow' },
    ],
    faqs: [
      ['What is कामCREW?', 'कामCREW, also written KaamCrew, is Sheersh Tiwari’s independent AI agent control center built around Hermes. It brings task state, conversations, configuration, and research into a web workspace.'],
      ['What did Sheersh build versus Hermes?', 'Sheersh built the Next.js and TypeScript control layer and its gateway and task-state integrations. Hermes supplies the underlying agent runtime.'],
      ['Can I see a public demo?', 'A public live-demo URL has not been supplied for this project. Contact Sheersh to discuss the build and what can be shared.'],
    ], related: ['/services/ai-workflow-automation', '/services/custom-software'],
  },
  {
    path: '/work/sql-performance', kind: 'case-study', label: 'SQL performance case study',
    title: 'SQL Performance Case Study: 200M+ Records | Sheersh Tiwari',
    description: 'Sheersh Tiwari’s portfolio-reported database optimization: a cross-module query across 200M+ records reduced from 15 minutes to 6 seconds on an anonymized platform.',
    heading: 'From 15 minutes to 6 seconds.',
    summary: 'This case study summarizes my portfolio-reported database performance work for an anonymized US life-sciences lab-informatics platform, involving a dataset of more than 200 million records.',
    facts: ['200M+ records / Reported scope', '15 min → 6 sec / Reported query time', '92% lower CPU / Reported result'],
    sections: [
      { title: 'The bottleneck', paragraphs: ['A cross-module search query relied on expensive multi-table work across a large relational dataset. Long response times affected the usefulness of the application and put pressure on the database server.'] },
      { title: 'The engineering work', paragraphs: ['My recorded work focused on SQL refactoring, execution-plan analysis, and database performance. The approach examined expensive scans and joins, filter patterns, and index coverage rather than treating the slow query as an isolated application symptom.'], items: ['Inspect query plans and identify the costly data-access steps.', 'Refactor the cross-module query and review relevant composite indexing.', 'Compare the changed query with the original workload.', 'Document the changes and the application behavior they affect.'] },
      { title: 'Reported outcomes', paragraphs: ['The portfolio reports a reduction in query time from 15 minutes to 6 seconds across a 200M+ record dataset, alongside 92% lower CPU load. These figures describe this specific engagement and workload.', 'The client is anonymized. Raw production data, a reproducible benchmark package, and an independent audit are not published here. The numbers are portfolio-reported outcomes, not a promise for another system.'] },
      { title: 'What a similar engagement would need', paragraphs: ['For another system, I would start with its query, database engine, execution plan, data distribution, and operational constraints. A baseline and agreed acceptance criteria make it possible to assess whether an improvement is useful.', 'The same process can produce a different outcome on a different schema or workload. A targeted review is more informative than assuming the previous speedup will transfer.'], link: '/services/database-optimization', linkLabel: 'Explore database optimization services' },
    ],
    faqs: [
      ['Are these independently audited benchmarks?', 'No. The 200M+ records, 15-minute to 6-second timing, and 92% CPU reduction are portfolio-reported outcomes for an anonymized engagement. Public benchmark data is not provided.'],
      ['Which parts of this work can you explain publicly?', 'The engineering approach, query-plan investigation, indexing considerations, and reported outcomes can be discussed without disclosing confidential client data or credentials.'],
      ['How can we evaluate our own slow queries?', 'Share the database engine, affected query or report, timing, and any sanitized schema or execution plan that may be shared. We can define a specific investigation and measurement approach.'],
    ], related: ['/services/database-optimization', '/services/custom-software'],
  },
];

export const normalizePath = path => (path || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
export const getSearchPage = path => searchPages.find(page => page.path === normalizePath(path));
