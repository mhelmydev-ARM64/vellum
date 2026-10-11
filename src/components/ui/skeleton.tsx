import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-lg bg-secondary/60 animate-shimmer",
        "bg-[linear-gradient(100deg,transparent_20%,color-mix(in_oklab,var(--foreground)_7%,transparent)_42%,transparent_62%)] bg-[length:220%_100%]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
