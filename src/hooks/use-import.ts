import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useLibrary } from "@/store/library";
import type { ImportResult } from "@/store/library";

/** Import with busy state + one toast per file. Shared by the dropzone and window-level drops. */
export function useImport() {
  const { importFiles } = useLibrary();
  const [busy, setBusy] = useState(false);

  const importWithFeedback = useCallback(
    async (incoming: File[]) => {
      setBusy(true);
      try {
        const results = await importFiles(incoming);
        for (const result of results) toastResult(result);
      } catch (error) {
        toast.error("Import failed", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setBusy(false);
      }
    },
    [importFiles],
  );

  return { busy, importWithFeedback };
}

function toastResult(result: ImportResult) {
  if (result.kind === "unsupported" || (result.kind === "csv" && !result.cards)) {
    toast.error(result.name, { description: result.message });
    return;
  }
  toast.success(result.name, { description: result.message });
}
