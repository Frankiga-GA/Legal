// =============================================================================
// src/components/FloatingBlobs.jsx
// =============================================================================
// Tres blobs de gradiente que se mueven lento en el fondo. Sensacion de
// "vivo" sin distraer.
// =============================================================================

const BLOB_CLASSES = [
  'animate-float-slow',
  'animate-float-slower',
  'animate-float-slowest',
];

const FloatingBlobs = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div
      className={`absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-brand-gold/[0.08] blur-3xl ${BLOB_CLASSES[0]}`}
    />
    <div
      className={`absolute right-[-120px] top-1/3 h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-3xl ${BLOB_CLASSES[1]}`}
    />
    <div
      className={`absolute bottom-[-160px] left-1/3 h-[480px] w-[480px] rounded-full bg-amber-500/[0.08] blur-3xl ${BLOB_CLASSES[2]}`}
    />
  </div>
);

export default FloatingBlobs;
