import { motion } from 'framer-motion';

const CAPABILITIES = [
  {
    icon: '⚡',
    title: 'High-Throughput Web Platforms',
    desc: 'Full-stack applications with sub-second page loads, modular React architecture, and clean UI engineering.',
  },
  {
    icon: '🚀',
    title: 'Database & Query Acceleration',
    desc: 'Fixing slow SQL queries, setting up composite indexes, and reducing CPU loads across millions of rows.',
  },
  {
    icon: '⚙️',
    title: 'Robust Microservices & APIs',
    desc: 'Building scalable Spring Boot and Python backend APIs with secure authentication and zero-downtime execution.',
  },
  {
    icon: '☁️',
    title: 'Cloud Infra & Automation',
    desc: 'Deploying Docker containers, AWS cloud environments, and automated CI/CD integration pipelines.',
  },
];

export default function ServicesValueProp() {
  return (
    <section id="services" className="max-w-6xl mx-auto px-6 py-20">
      <div className="card p-8 sm:p-12 rounded-3xl glass border border-line text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 mb-12">
          <span className="chip px-3.5 py-1.5 rounded-full text-xs font-mono text-cyan">
            💡 Full-Stack Engineering Expertise
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-ink leading-tight">
            If I can build this portfolio, <span className="grad-text">I can build anything for you.</span>
          </h2>
          <p className="text-muted text-base leading-relaxed">
            From interactive client interfaces to sub-second database optimizations and complex REST APIs, I deliver production-ready solutions tailored to your project requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl glass border border-line flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl mb-3 block">{cap.icon}</span>
                <h3 className="font-display font-bold text-base text-ink mb-2">{cap.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{cap.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}