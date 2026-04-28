"use client";

import { motion } from "framer-motion";
import { Steering } from "@/components/icons/Steering";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { SeatLayout } from "@/lib/types";

interface Props {
  layout: SeatLayout;
  taken: string[];
  selected: string | null;
  onSelect: (seat: string) => void;
  vip?: boolean;
}

export function SeatMap({ layout, taken, selected, onSelect, vip }: Props) {
  const { t } = useI18n();
  const cols = Math.max(...layout.map((r) => r.length));
  const takenSet = new Set(taken);

  return (
    <div className="rounded-3xl border border-ink-200 bg-gradient-to-b from-ink-50 to-white p-5 sm:p-8 shadow-soft">
      {/* Bus body */}
      <div className="mx-auto max-w-md relative">
        {/* Front of bus */}
        <div className="relative h-12 mb-2 rounded-t-[3rem] border border-ink-200 border-b-0 bg-white flex items-center justify-center">
          <span className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold">
            {t("front_of_bus")}
          </span>
        </div>

        <div className="rounded-b-3xl rounded-t-md border border-ink-200 bg-white p-4 sm:p-5 shadow-card">
          <div
            className="grid gap-2 sm:gap-2.5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {layout.flatMap((row, ri) =>
              Array.from({ length: cols }).map((_, ci) => {
                const cell = row[ci] ?? null;

                if (cell === "driver") {
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className="aspect-square rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 flex items-center justify-center text-ink-400"
                      title="Driver"
                    >
                      <Steering className="h-5 w-5" />
                    </div>
                  );
                }
                if (!cell) {
                  return <div key={`${ri}-${ci}`} className="aspect-square" />;
                }

                const isTaken = takenSet.has(cell);
                const isSelected = selected === cell;
                return (
                  <motion.button
                    key={`${ri}-${ci}`}
                    type="button"
                    disabled={isTaken}
                    onClick={() => onSelect(cell)}
                    whileHover={!isTaken ? { y: -2 } : undefined}
                    whileTap={!isTaken ? { scale: 0.94 } : undefined}
                    initial={false}
                    animate={
                      isSelected
                        ? {
                            backgroundColor: "rgb(79 70 229)",
                            color: "rgb(255 255 255)",
                            borderColor: "rgb(67 56 202)",
                          }
                        : isTaken
                          ? {
                              backgroundColor: "rgb(241 245 249)",
                              color: "rgb(148 163 184)",
                              borderColor: "rgb(226 232 240)",
                            }
                          : {
                              backgroundColor: "rgb(255 255 255)",
                              color: "rgb(30 41 59)",
                              borderColor: "rgb(199 210 254)",
                            }
                    }
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className={cn(
                      "relative aspect-square rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center justify-center",
                      "shadow-soft",
                      !isTaken && !isSelected && "hover:border-brand-400 hover:shadow-glow",
                      isTaken && "cursor-not-allowed line-through opacity-60",
                      vip && !isTaken && !isSelected && "ring-1 ring-amber-200/60"
                    )}
                    aria-label={`Seat ${cell}${isTaken ? " (taken)" : ""}`}
                  >
                    {cell}
                    {isSelected && (
                      <motion.span
                        layoutId="seat-pulse"
                        className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white"
                      />
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Back of bus */}
        <div className="h-2 mt-2 rounded-b-3xl bg-ink-200" />
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs">
        <Legend swatchClass="bg-white border-brand-200" label={t("legend_available")} />
        <Legend swatchClass="bg-brand-600 border-brand-700" label={t("legend_selected")} />
        <Legend swatchClass="bg-ink-100 border-ink-200" label={t("legend_taken")} lineThrough />
      </div>
    </div>
  );
}

function Legend({
  swatchClass,
  label,
  lineThrough,
}: {
  swatchClass: string;
  label: string;
  lineThrough?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("inline-block h-4 w-4 rounded-md border", swatchClass)} />
      <span className={cn("text-ink-600", lineThrough && "line-through")}>{label}</span>
    </div>
  );
}
