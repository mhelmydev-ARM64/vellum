import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowLeftIcon, ClockIcon, FileTextIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { extractHeadings, readingTimeMinutes } from "@/lib/analyze";
import { renderMarkdown } from "@/lib/markdown";
import type { SourceFile } from "@/lib/types";
import { cn, pluralize } from "@/lib/utils";

interface ReaderViewProps {
  file: SourceFile;
  onBack: () => void;
}

export function ReaderView({ file, onBack }: ReaderViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const proseRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const html = useMemo(() => renderMarkdown(file.content), [file.content]);
  const headings = useMemo(() => extractHeadings(file.content), [file.content]);

  const { scrollYProgress } = useScroll({ container: scrollRef });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [file.id]);

  const handleCopy = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-copy-code]");
    if (!button) return;
    const code = button.closest(".vellum-code")?.querySelector("code")?.textContent ?? "";
    void navigator.clipboard?.writeText(code).then(() => {
      const original = button.textContent;
      button.textContent = "Copied ✓";
      button.dataset.copied = "true";
      window.setTimeout(() => {
        button.textContent = original ?? "Copy";
        delete button.dataset.copied;
      }, 1600);
    });
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { root: container, rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );

    for (const heading of headings) {
      const element = container.querySelector(`#${CSS.escape(heading.id)}`);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [headings, html]);

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem)]">
      <motion.div
        className="absolute inset-x-0 top-0 z-20 h-[2px] origin-left bg-gradient-to-r from-brand via-aurora-2 to-aurora-3"
        style={{ scaleX: progress }}
      />

      <div ref={scrollRef} className="relative flex-1 overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
          className="mx-auto w-full max-w-[74ch] px-5 pt-10 pb-32 sm:px-8"
        >
          <div className="mb-10 flex flex-wrap items-center gap-3">
            <Button variant="glass" size="sm" onClick={onBack}>
              <ArrowLeftIcon className="size-3.5" />
              Library
            </Button>
            <Badge variant="glass" className="gap-1.5">
              <FileTextIcon className="size-3" />
              Note
            </Badge>
            <span className="text-xs text-muted-foreground">
              {pluralize(file.wordCount ?? 0, "word")} ·{" "}
              <ClockIcon className="inline size-3 align-[-1px]" />{" "}
              {pluralize(readingTimeMinutes(file.content), "min")} read
            </span>
          </div>

          <div
            ref={proseRef}
            dir="auto"
            onClick={handleCopy}
            className="vellum-prose prose prose-invert dark:prose-invert prose-headings:font-semibold prose-p:text-[15.5px] prose-p:leading-[1.85] prose-li:text-[15.5px] prose-li:leading-[1.75]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </motion.div>
      </div>

      {headings.length > 1 ? (
        <aside className="sticky top-0 hidden h-full w-64 shrink-0 overflow-y-auto border-l border-border/60 py-14 pr-6 pl-4 lg:block">
          <p className="mb-4 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            On this page
          </p>
          <nav className="space-y-0.5" aria-label="Table of contents">
            {headings.map((heading) => (
              <button
                key={heading.id}
                type="button"
                onClick={() => {
                  scrollRef.current
                    ?.querySelector(`#${CSS.escape(heading.id)}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={cn(
                  "relative block w-full rounded-md py-1.5 pr-2 text-left text-[13px] leading-snug transition-colors duration-200",
                  heading.depth === 2 ? "pl-4" : heading.depth === 3 ? "pl-8" : "pl-2 font-medium",
                  activeId === heading.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/90",
                )}
              >
                {activeId === heading.id ? (
                  <motion.span
                    layoutId="toc-active"
                    className="absolute inset-y-0 left-0 w-[2px] rounded-full bg-gradient-to-b from-brand to-aurora-2"
                  />
                ) : null}
                <span className="line-clamp-2">{heading.text}</span>
              </button>
            ))}
          </nav>
        </aside>
      ) : null}
    </div>
  );
}

export function ReaderSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[74ch] space-y-4 px-5 pt-16 sm:px-8">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <div className="space-y-2.5 pt-8">
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={index} className={cn("h-4", index % 4 === 3 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}
