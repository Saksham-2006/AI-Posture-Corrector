import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { HeatmapData } from "@/features/insights/insights";

type Props = {
  data: HeatmapData;
};

function colorFor(score: number | null): string {
  if (score === null) return "hsl(var(--muted) / 0.45)";
  // 0 (rose) → 50 (amber) → 100 (mint)
  if (score >= 75) {
    const t = (score - 75) / 25;
    return `hsl(160 60% ${60 - t * 12}%)`;
  }
  if (score >= 50) {
    const t = (score - 50) / 25;
    // amber → mint
    const h = 35 + t * (160 - 35);
    return `hsl(${h} 70% 60%)`;
  }
  // 0..50 rose → amber
  const t = score / 50;
  const h = 355 - t * (355 - 35);
  return `hsl(${h} 75% 62%)`;
}

const HOUR_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];

export function Heatmap({ data }: Props) {
  return (
    <div className="w-full">
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {/* Day labels column */}
        <div className="flex shrink-0 flex-col gap-1.5 pt-6 pr-1">
          {data.rows.map((row) => (
            <div
              key={row.label + (row.isToday ? "-today" : "")}
              className={`grid h-5 place-items-center text-[10px] font-medium uppercase tracking-wider ${
                row.isToday ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {row.label}
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-[480px]">
          {/* Hour labels */}
          <div className="grid h-6 grid-cols-8 text-[10px] uppercase tracking-wider text-muted-foreground">
            {HOUR_LABELS.map((h) => (
              <div key={h} className="text-left">
                {h}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="flex flex-col gap-1.5">
            {data.rows.map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-24 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                {row.cells.map((cell, hour) => (
                  <Tooltip key={hour}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: rIdx * 0.02 + hour * 0.005, duration: 0.3 }}
                        className="aspect-square w-full rounded-[5px] cursor-default ring-1 ring-card-border/20"
                        style={{
                          background: colorFor(cell.score),
                          opacity: cell.score === null ? 0.55 : 1,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {cell.score === null ? (
                        <span>{row.label} {hour}:00 — no data</span>
                      ) : (
                        <span>
                          {row.label} {hour}:00 — score {cell.score} ({cell.samples} sample{cell.samples === 1 ? "" : "s"})
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Low</span>
        <div className="flex h-2 w-32 overflow-hidden rounded-full">
          {Array.from({ length: 12 }).map((_, i) => {
            const score = (i / 11) * 100;
            return <div key={i} className="flex-1" style={{ background: colorFor(score) }} />;
          })}
        </div>
        <span>High</span>
      </div>
    </div>
  );
}
