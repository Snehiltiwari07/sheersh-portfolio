import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clientReviews } from '../data/profile';

function StarRating({ rating }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;

  return (
    <div className="flex items-center gap-1 text-amber-400">
      {[...Array(fullStars)].map((_, i) => (
        <span key={i} className="text-sm">★</span>
      ))}
      {hasHalf && <span className="text-sm">½</span>}
      <span className="font-mono text-xs font-bold text-white ml-1.5">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function Reviews() {
  const [selectedYear, setSelectedYear] = useState('All');

  const years = ['All', '2026', '2025', '2024', '2023', '2022'];

  const filteredReviews = selectedYear === 'All'
    ? clientReviews
    : clientReviews.filter(r => r.year === selectedYear);

  return (
    <section id="reviews" className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center space-y-3 mb-10">
        <p className="cmd-label justify-center flex">tail -n 10 client_reviews.log</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
          Client Reviews & Endorsements
        </h2>
        <p className="text-muted text-sm max-w-xl mx-auto">
          Ratings and feedback from engineering directors, startup founders, and technical managers (2022 – 2026).
        </p>
      </div>

      {/* Year Filter Chips */}
      <div className="flex justify-center gap-2 mb-10 flex-wrap">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-1.5 rounded-full font-mono text-xs transition-all ${
              selectedYear === year
                ? 'grad-bg text-white font-semibold shadow-md'
                : 'glass text-muted hover:text-white border border-line'
            }`}
          >
            {year === 'All' ? 'All Reviews (10)' : year}
          </button>
        ))}
      </div>

      {/* Reviews Bento Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredReviews.map((rev, i) => (
            <motion.div
              key={rev.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className="card p-6 rounded-2xl glass flex flex-col justify-between border border-line hover:border-violet/40"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-display font-bold text-white text-base">{rev.name}</h3>
                    <p className="font-mono text-xs text-muted">{rev.role}</p>
                  </div>
                  <StarRating rating={rev.rating} />
                </div>

                <p className="text-sm text-text/90 italic leading-relaxed mb-6">
                  "{rev.comment}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-line/60 text-xs font-mono text-muted">
                <span className="chip px-2.5 py-1 rounded-md text-[11px] text-cyan">{rev.service}</span>
                <span className="text-violet font-semibold">{rev.year}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}