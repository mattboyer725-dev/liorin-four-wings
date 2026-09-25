import { createFileRoute } from "@tanstack/react-router";
import { AcademyStrip } from "@/components/academy-strip";
import { CommandFloor } from "@/components/command-floor";
import { WingNote } from "@/components/wing-note";

export const Route = createFileRoute("/combined")({ component: CombinedPage });

function CombinedPage() {
  return (
    <div className="flex flex-col gap-10">
      <CommandFloor tone="combined" />
      <section>
        <h2 className="mb-4 text-sm uppercase tracking-[0.16em] text-muted">Academy, kept</h2>
        <AcademyStrip compact />
      </section>
      <WingNote wing="combined" />
    </div>
  );
}
