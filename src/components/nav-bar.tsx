import { motion } from "framer-motion";
import { LayersIcon, LibraryIcon, SparklesIcon, ZapIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallButton } from "@/components/install-button";
import { cn, pluralize } from "@/lib/utils";
import type { View } from "@/lib/types";

interface NavBarProps {
  view: View;
  dueCount: number;
  totalCards: number;
  onNavigate: (view: View) => void;
}

const NAV_ITEMS: { name: View["name"]; label: string; icon: typeof LibraryIcon }[] = [
  { name: "library", label: "Library", icon: LibraryIcon },
  { name: "review", label: "Review", icon: LayersIcon },
  { name: "insights", label: "Insights", icon: SparklesIcon },
];

export function NavBar({ view, dueCount, totalCards, onNavigate }: NavBarProps) {
  const active = view.name === "reader" ? "library" : view.name;

  return (
    <header className="sticky top-0 z-40">
      <div className="glass hairline">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate({ name: "library" })}
            className="group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
            aria-label="Vellum — back to library"
          >
            <Logo
              size={26}
              className="transition-opacity duration-200 group-hover:opacity-85"
              tagline={undefined}
            />
          </button>

          <div className="mx-auto flex items-center" role="navigation" aria-label="Primary">
            <div className="relative flex items-center gap-0.5 rounded-full border border-border/80 bg-background/40 p-1 backdrop-blur-xl">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => onNavigate({ name: item.name } as View)}
                    className={cn(
                      "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring/70",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.08] shadow-[0_4px_24px_-8px_color-mix(in_oklab,var(--brand)_60%,transparent)]"
                        style={{ backdropFilter: "blur(12px)" }}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    <item.icon className="relative z-10 size-[15px]" strokeWidth={2} />
                    <span className="relative z-10 hidden sm:inline">{item.label}</span>

                    {item.name === "review" && dueCount > 0 ? (
                      <span className="relative z-10 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-white shadow-[0_0_12px_-2px_color-mix(in_oklab,var(--brand)_90%,transparent)]">
                        {dueCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {totalCards > 0 ? (
              <span className="hidden items-center gap-1.5 rounded-full border border-border/80 px-2.5 py-1 text-[11px] text-muted-foreground md:flex">
                <ZapIcon className="size-3 text-easy" />
                {pluralize(totalCards, "card")}
              </span>
            ) : null}
            <InstallButton />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
