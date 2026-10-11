import { useEffect, useRef } from "react";

type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

/**
 * Global keyboard shortcuts. Skips keystrokes typed into inputs and any
 * combo using a modifier key so browser shortcuts keep working.
 */
export function useHotkeys(map: HotkeyMap, enabled = true) {
  const handler = useRef(map);

  useEffect(() => {
    handler.current = map;
  });

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      const key = event.key === " " ? "space" : event.key.toLowerCase();
      const action = handler.current[key];
      if (!action) return;
      event.preventDefault();
      action(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
