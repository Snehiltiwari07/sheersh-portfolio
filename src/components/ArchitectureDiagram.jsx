import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { architectureNodes } from '../data/profile';

export default function ArchitectureDiagram() {
  const [selectedNode, setSelectedNode] = useState(architectureNodes[0]);

  return (
    <section id="architecture" className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center space-y-3 mb-12">
        <p className="cmd-label justify-center flex">exec system_topology.draw</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink">
          Production System Architecture
        </h2>
        <p className="text-muted text-sm max-w-xl mx-auto">
          An interactive topology flow showing how React frontends, Spring Boot APIs, Kafka streaming, and AWS databases interconnect in production.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Pipeline Flow */}
        <div className="lg:col-span-7 flex flex-col gap-3 relative">
          {architectureNodes.map((node, index) => {
            const isSelected = selectedNode.id === node.id;
            return (
              <div key={node.id} className="relative">
                {/* Visual Pipeline Connector */}
                {index > 0 && (
                  <div className="w-0.5 h-5 bg-gradient-to-b from-cyan to-violet mx-auto my-0.5 opacity-60" />
                )}

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setSelectedNode(node)}
                  className={`w-full p-4 rounded-2xl text-left transition-all border cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'glass border-cyan bg-violet/10 shadow-lg shadow-cyan/10'
                      : 'card border-line hover:border-violet/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl">{node.icon}</span>
                    <div>
                      <span className="chip px-2.5 py-0.5 rounded text-[10px] text-cyan font-mono">
                        {node.category}
                      </span>
                      <h3 className="font-display font-bold text-sm sm:text-base text-ink mt-0.5">
                        {node.title}
                      </h3>
                    </div>
                  </div>

                  <span className="font-mono text-xs text-violet font-semibold hidden sm:inline-block">
                    {node.metrics}
                  </span>
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* Right Technical Breakdown Card */}
        <div className="lg:col-span-5 flex">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full card p-6 sm:p-8 rounded-3xl glass border border-line flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 border-b border-line pb-4 mb-5">
                  <span className="text-4xl">{selectedNode.icon}</span>
                  <div>
                    <span className="chip px-2.5 py-0.5 rounded-full text-[10px] text-cyan font-mono">
                      {selectedNode.category}
                    </span>
                    <h3 className="font-display font-bold text-xl text-ink mt-1">
                      {selectedNode.title}
                    </h3>
                  </div>
                </div>

                <p className="text-muted text-sm leading-relaxed mb-6">
                  {selectedNode.description}
                </p>
              </div>

              <div>
                <p className="font-mono text-xs text-violet mb-2 font-semibold">
                  Technologies & Specs:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.techs.map((tech) => (
                    <span key={tech} className="chip px-2.5 py-1 rounded-lg text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}