import { motion } from "framer-motion";

/** Soft aurora gradients + hairline grid that sit behind the whole app. */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-[28vh] -left-[12vw] size-[62vw] rounded-full blur-[120px] animate-aurora"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--aurora-1) 46%, transparent), transparent 66%)",
          opacity: 0.5,
        }}
      />
      <motion.div
        className="absolute top-[6vh] -right-[16vw] size-[54vw] rounded-full blur-[130px] animate-aurora"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, color-mix(in oklab, var(--aurora-2) 40%, transparent), transparent 68%)",
          opacity: 0.42,
          animationDelay: "-9s",
        }}
      />
      <motion.div
        className="absolute -bottom-[26vh] left-[22vw] size-[58vw] rounded-full blur-[140px] animate-aurora"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--aurora-3) 30%, transparent), transparent 70%)",
          opacity: 0.28,
          animationDelay: "-17s",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--foreground) 12%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 12%, transparent) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(120% 90% at 50% 0%, #000 12%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(120% 90% at 50% 0%, #000 12%, transparent 72%)",
        }}
      />

      <div className="absolute inset-0 grain" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
