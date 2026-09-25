import { createFileRoute } from "@tanstack/react-router";
import { CommandFloor } from "@/components/command-floor";
import { WingNote } from "@/components/wing-note";

export const Route = createFileRoute("/conquest")({ component: ConquestPage });

function ConquestPage() {
  return (
    <div className="flex flex-col gap-10">
      <CommandFloor tone="conquest" />
      <WingNote wing="conquest" />
    </div>
  );
}
