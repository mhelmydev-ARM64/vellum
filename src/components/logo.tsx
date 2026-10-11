import { useId } from "react";
import { cn } from "@/lib/utils";

export type LogoVariant = "plate" | "mono";

interface MarkProps {
  className?: string;
  size?: number;
  variant?: LogoVariant;
}

/**
 * Vellum mark: two cards caught mid-flip on a gradient plate.
 * Pure SVG paths — no raster assets, crisp at 16px and at 512px.
 */
export function LogoMark({ className, size = 32, variant = "plate" }: MarkProps) {
  const id = useId().replace(/:/g, "");

  if (variant === "mono") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className={cn("shrink-0", className)}
        aria-hidden="true"
      >
        <g fill="currentColor">
          <rect x="9.4" y="7.6" width="12.4" height="16.8" rx="3" opacity="0.42" transform="rotate(-15 15.6 16)" />
          <rect x="10.2" y="7.6" width="12.4" height="16.8" rx="3" transform="rotate(13 16.4 16)" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-plate`} x1="3" y1="1" x2="29" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9A8BFF" />
          <stop offset="0.48" stopColor="#6D5CFF" />
          <stop offset="1" stopColor="#2F7BFF" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.06" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16 6) rotate(90) scale(18)">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="32" height="32" rx="9.2" fill={`url(#${id}-plate)`} />
      <rect width="32" height="32" rx="9.2" fill={`url(#${id}-glow)`} />
      <rect
        x="0.55"
        y="0.55"
        width="30.9"
        height="30.9"
        rx="8.7"
        stroke={`url(#${id}-edge)`}
        strokeWidth="1.1"
      />

      <g>
        <rect
          x="9.1"
          y="7.4"
          width="12.6"
          height="17"
          rx="3.1"
          fill="#FFFFFF"
          fillOpacity="0.46"
          transform="rotate(-16 15.4 15.9)"
        />
        <rect
          x="10.3"
          y="7.4"
          width="12.6"
          height="17"
          rx="3.1"
          fill="#FFFFFF"
          transform="rotate(12 16.6 15.9)"
        />
        <rect
          x="13"
          y="11.4"
          width="7.2"
          height="1.5"
          rx="0.75"
          fill="#6D5CFF"
          fillOpacity="0.55"
          transform="rotate(12 16.6 12.15)"
        />
        <rect
          x="13"
          y="14.6"
          width="4.9"
          height="1.5"
          rx="0.75"
          fill="#6D5CFF"
          fillOpacity="0.34"
          transform="rotate(12 15.45 15.35)"
        />
      </g>
    </svg>
  );
}

interface LogoProps {
  className?: string;
  size?: number;
  variant?: LogoVariant;
  wordmarkClassName?: string;
  tagline?: string;
}

/** Mark + wordmark lockup used in the navigation bar and on marketing surfaces. */
export function Logo({ className, size = 28, variant = "plate", wordmarkClassName, tagline }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} variant={variant} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[15px] font-semibold tracking-[-0.028em] text-foreground",
            wordmarkClassName,
          )}
        >
          Vellum
        </span>
        {tagline ? (
          <span className="mt-1 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
