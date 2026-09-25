import { Chess, type Square } from "chess.js";
import { useMemo } from "react";
import { PixelPiece } from "@/lib/chess/pixel-pieces";
import { cn } from "@/lib/utils";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

function squareName(file: number, rank: number): Square {
  return `${FILES[file]}${rank + 1}` as Square;
}

export function PixelBoard({
  chess,
  selected,
  onSelect,
  orientation = "w",
  lastMove,
  disabled,
}: {
  chess: Chess;
  selected: Square | null;
  onSelect: (square: Square) => void;
  orientation?: "w" | "b";
  lastMove?: { from: Square; to: Square } | null;
  disabled?: boolean;
}) {
  const legal = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(chess.moves({ square: selected, verbose: true }).map((m) => m.to));
  }, [chess, selected]);

  const ranks = orientation === "w" ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const files = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  return (
    <div className="w-full max-w-[min(100%,512px)]">
      <div
        className="grid aspect-square w-full grid-cols-8 border-4 border-primary"
        role="grid"
        aria-label="8-bit chess board"
        style={{ imageRendering: "pixelated" }}
      >
        {ranks.flatMap((rank) =>
          files.map((file) => {
            const square = squareName(file, rank);
            const piece = chess.get(square);
            const dark = (file + rank) % 2 === 0;
            const isSel = selected === square;
            const isLast = lastMove?.from === square || lastMove?.to === square;
            const isLegal = legal.has(square);
            return (
              <button
                key={square}
                type="button"
                role="gridcell"
                disabled={disabled}
                aria-label={piece ? `${piece.color === "w" ? "White" : "Black"} ${piece.type} on ${square}` : square}
                onClick={() => onSelect(square)}
                className={cn(
                  "relative flex items-center justify-center",
                  dark ? "bg-square-dark" : "bg-square-light",
                  isSel && "outline outline-2 outline-offset-[-2px] outline-primary",
                  isLast && "brightness-125",
                )}
              >
                {piece ? (
                  <PixelPiece piece={piece.type} color={piece.color} className="h-[86%] w-[86%]" />
                ) : null}
                {isLegal ? (
                  <span
                    className={cn(
                      "absolute bg-primary",
                      piece ? "inset-1 opacity-40" : "size-2",
                    )}
                  />
                ) : null}
                {file === files[0] ? (
                  <span className="absolute left-0.5 top-0 text-[7px] leading-none text-bg/70">
                    {rank + 1}
                  </span>
                ) : null}
                {rank === ranks[ranks.length - 1] ? (
                  <span className="absolute bottom-0 right-0.5 text-[7px] leading-none text-bg/70">
                    {FILES[file]}
                  </span>
                ) : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
