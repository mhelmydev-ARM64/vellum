import { useEffect, useState } from "react";

/** A shared clock for due-counts, refreshed every 30s so badges stay honest. */
export function useNow() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return now;
}
