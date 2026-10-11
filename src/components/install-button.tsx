import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePwa } from "@/hooks/use-pwa";

export function InstallButton() {
  const { canInstall, installed, install } = usePwa();

  if (!canInstall || installed) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="brand" size="sm" className="hidden sm:inline-flex" onClick={() => void install()}>
          <DownloadIcon className="size-3.5" />
          Install
        </Button>
      </TooltipTrigger>
      <TooltipContent>Install Vellum as an offline app</TooltipContent>
    </Tooltip>
  );
}
