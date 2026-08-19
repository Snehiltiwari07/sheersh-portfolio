export default function ThemeAdaptiveImage({ src, alt, className = "" }) {
  return (
    <div className={`relative overflow-hidden group ${className}`}>
      {/* Dynamic Ambient Theme Backlight Glow */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet via-cyan to-pink opacity-35 blur-md group-hover:opacity-75 transition duration-500" />

      {/* Image Container with Dynamic Contrast Filters */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden glass border border-line">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 filter contrast-[1.05] brightness-[0.95] dark:brightness-[0.90] saturate-[1.10]"
        />

        {/* Theme Contrast Blend Layers */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent opacity-60 pointer-events-none mix-blend-multiply" />
        <div className="absolute inset-0 bg-violet/10 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none mix-blend-color" />
      </div>
    </div>
  );
}