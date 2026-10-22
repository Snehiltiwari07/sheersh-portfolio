import { useState } from 'react';

const logos = {
  'Core Java': 'java', JavaScript: 'javascript', 'HTML & CSS': 'html5', Linux: 'linux',
  'Spring Boot': 'spring', React: 'react', PostgreSQL: 'postgresql', GraphQL: 'graphql',
  'Git / CI/CD': 'git', Python: 'python', 'AWS RDS': 'amazonwebservices', AWS: 'amazonwebservices',
  Redis: 'redis', Kafka: 'apachekafka', Docker: 'docker', 'Next.js': 'nextjs',
  TypeScript: 'typescript', 'SSE / SQLite': 'sqlite', Ollama: 'ollama',
  DeepSeek: 'deepseek',
  SQL: 'postgresql', 'SQL tuning': 'postgresql', 'Database architecture': 'postgresql',
};

const glyphs = {
  DSA: <><path d="M12 4v5M5 15v-4h14v4"/><circle cx="12" cy="3" r="2"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/></>,
  OOP: <><path d="m12 3 8 4v10l-8 4-8-4V7l8-4Zm-8 4 8 4 8-4m-8 4v10"/></>,
  REST: <><path d="m7 6-5 6 5 6m10-12 5 6-5 6m-4-13-2 14"/></>,
  ETL: <><path d="M3 5h5v5H3zM16 14h5v5h-5zM8 7h5v10h3m-6-2 3 2-3 2"/></>,
  RAG: <><path d="M3 4h11v14H3zM6 8h5M6 11h4m8 4 4 4"/><circle cx="16" cy="12" r="5"/></>,
  'Vector databases': <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v13c0 4 16 4 16 0V5M4 11c0 4 16 4 16 0"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="17" r="1"/><path d="m10 15 4 1"/></>,
  MCP: <><path d="m3 14 8-8a4 4 0 0 1 6 6l-7 7m-5-2 8-8m0 10 4 3m0-16 3-3"/></>,
  'Agent evals': <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M8 10l2 2 5-5M8 16h8"/></>,
};

// Brand logos are local assets. Concepts use descriptive symbols rather than invented logos.
export default function JourneyTechIcon({ name }) {
  const [failed, setFailed] = useState(false);
  const logo = logos[name];
  if (logo && !failed) return <span className="journey-tech-icon is-brand" aria-hidden="true"><img src={`/tech-icons/${logo}.svg`} alt="" width="24" height="24" loading="lazy" decoding="async" onError={() => setFailed(true)} /></span>;
  return <span className="journey-tech-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{glyphs[name] || (['Microservices', 'Agent workflows', 'Agent harnesses', 'Hermes'].includes(name)
    ? <><rect x="8" y="8" width="8" height="8" rx="2"/><path d="M12 3v5m0 8v5M3 12h5m8 0h5"/><circle cx="12" cy="2" r="1"/><circle cx="12" cy="22" r="1"/><circle cx="2" cy="12" r="1"/><circle cx="22" cy="12" r="1"/></>
    : <><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4M10 10h4v4h-4z"/></>)}</svg></span>;
}
