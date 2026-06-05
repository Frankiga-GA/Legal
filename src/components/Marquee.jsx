// =============================================================================
// src/components/Marquee.jsx
// =============================================================================
// Ticker horizontal infinito. Usado en la landing para mostrar fuentes
// legales (El Peruano, TC, PJ, etc) - da autoridad visual.
// =============================================================================

const Marquee = ({ items, speed = 30, className = '' }) => {
  // Duplicamos los items para que el loop sea perfecto
  const looped = [...items, ...items];
  return (
    <div className={`group relative flex w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)] ${className}`}>
      <div
        className="flex shrink-0 gap-12 pr-12 will-change-transform animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {looped.map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent/60"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-gold/60" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
