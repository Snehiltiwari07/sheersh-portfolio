import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clientReviews } from '../data/profile';

function StarRating({ rating }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;

  return (
    <div className="flex items-center gap-1 text-amber-400">
      {[...Array(fullStars)].map((_, i) => (
        <span key={i} className="text-sm sm:text-base">★</span>
      ))}
      {hasHalf && <span className="text-sm sm:text-base">½</span>}
      <span className="font-mono text-xs font-bold text-white ml-1.5">{rating.toFixed(1)}</span>
    </div>
  );
}

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    scale: 0.97
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: (direction) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.2, ease: 'easeIn' }
  })
};

export default function Reviews() {
  const [selectedYear, setSelectedYear] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const years = ['All', '2026', '2025', '2024', '2023', '2022'];

  const filteredReviews = selectedYear === 'All'
    ? clientReviews
    : clientReviews.filter(r => r.year === selectedYear);

  // Reset slider index when year filter changes
  const handleYearChange = (year) => {
    setSelectedYear(year);
    setCurrentIndex(0);
  };

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % filteredReviews.length);
  }, [filteredReviews.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + filteredReviews.length) % filteredReviews.length);
  }, [filteredReviews.length]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying || filteredReviews.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, filteredReviews.length, handleNext]);

  const currentRev = filteredReviews[currentIndex] || filteredReviews[0];

  return (
    <section id="reviews" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <p className="cmd-label justify-center flex text-xs">tail -n 10 client_reviews.log</p>
        <h2 className="font-display font-bold text-2xl sm:text-4xl text-white tracking-tight">
          Client Reviews & Endorsements
        </h2>
        <p className="text-muted text-xs sm:text-sm max-w-lg mx-auto">
          Feedback from engineering directors, startup founders, and technical managers.
        </p>
      </div>

      {/* Year Filter Chips */}
      <div className="flex justify-center gap-1.5 sm:gap-2 mb-8 flex-wrap">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => handleYearChange(year)}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs transition-all cursor-pointer ${
              selectedYear === year
                ? 'grad-bg text-white font-semibold shadow-lg scale-105'
                : 'glass text-muted hover:text-white border border-line hover:border-violet/40'
            }`}
          >
            {year === 'All' ? `All (${clientReviews.length})` : year}
          </button>
        ))}
      </div>

      {/* Main Glassmorphic Carousel Card */}
      <div 
        className="relative glass rounded-3xl p-6 sm:p-10 border border-line shadow-2xl overflow-hidden min-h-[300px] flex flex-col justify-between"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Background Decorative Quote Mark & Ambient Glow */}
        <div className="absolute top-2 right-6 text-slate-800/20 font-serif text-8xl font-black select-none pointer-events-none">
          “
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet/10 rounded-full blur-3xl pointer-events-none" />

        {/* Slide Content */}
        {filteredReviews.length > 0 ? (
          <div className="relative min-h-[170px] flex flex-col justify-between">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentRev.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                {/* Header: Name, Role & Star Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/50 pb-4">
                  <div>
                    <h3 className="font-display font-bold text-white text-lg sm:text-xl">
                      {currentRev.name}
                    </h3>
                    <p className="font-mono text-xs text-muted mt-0.5">{currentRev.role}</p>
                  </div>
                  <StarRating rating={currentRev.rating} />
                </div>

                {/* Testimonial Quote */}
                <p className="text-sm sm:text-base text-text/90 italic leading-relaxed pt-1">
                  "{currentRev.comment}"
                </p>

                {/* Service Tag & Year */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="chip px-3 py-1 rounded-md text-xs font-mono text-cyan bg-cyan/10 border border-cyan/20">
                    {currentRev.service}
                  </span>
                  <span className="font-mono text-xs text-violet font-semibold">
                    {currentRev.year}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12 text-muted font-mono text-xs">
            No reviews found for {selectedYear}.
          </div>
        )}

        {/* Carousel Navigation Footer */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-line/60">
          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {filteredReviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 grad-bg shadow-sm'
                    : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Slide Count & Arrows */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-muted text-[11px]">
              <strong className="text-white">
                {String(currentIndex + 1).padStart(2, '0')}
              </strong> / {String(filteredReviews.length).padStart(2, '0')}
            </span>

            <div className="flex gap-1">
              <button
                onClick={handlePrev}
                className="w-8 h-8 rounded-xl glass border border-line flex items-center justify-center text-white hover:border-violet/50 active:scale-95 transition-all cursor-pointer"
                title="Previous review"
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 rounded-xl glass border border-line flex items-center justify-center text-white hover:border-violet/50 active:scale-95 transition-all cursor-pointer"
                title="Next review"
              >
                →
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}