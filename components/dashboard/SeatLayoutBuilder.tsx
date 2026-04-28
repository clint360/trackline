"use client";

import { motion } from "framer-motion";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Steering } from "@/components/icons/Steering";
import { cn } from "@/lib/utils";
import type { SeatLayout, SeatCell } from "@/lib/types";

type Tool = "seat" | "aisle" | "driver";

interface Props {
  initial?: SeatLayout;
  onChange?: (layout: SeatLayout) => void;
  cols?: number;
  locked?: boolean;
}

function defaultLayout(cols = 5): SeatLayout {
  return [
    Array.from({ length: cols }, (_, i) => (i === 0 ? "driver" : null)),
    ...Array.from({ length: 4 }, () =>
      Array.from({ length: cols }, () => null as SeatCell)
    ),
  ];
}

function autoLabel(layout: SeatLayout): SeatLayout {
  // Re-label seats sequentially: rowNum + letter
  let rowNum = 1;
  return layout.map((row) => {
    let hasSeat = false;
    let letterIdx = 0;
    const newRow = row.map((c) => {
      if (c === null || c === "driver") return c;
      hasSeat = true;
      const letter = String.fromCharCode("A".charCodeAt(0) + letterIdx++);
      return `${rowNum}${letter}`;
    });
    if (hasSeat) rowNum++;
    return newRow;
  });
}

export function SeatLayoutBuilder({
  initial,
  onChange,
  cols = 5,
  locked,
}: Props) {
  const [layout, setLayout] = useState<SeatLayout>(
    initial && initial.length ? initial : defaultLayout(cols)
  );
  const [tool, setTool] = useState<Tool>("seat");

  const colCount = useMemo(
    () => Math.max(cols, ...layout.map((r) => r.length)),
    [layout, cols]
  );

  const update = (next: SeatLayout) => {
    const labeled = autoLabel(next);
    setLayout(labeled);
    onChange?.(labeled);
  };

  const setCell = (ri: number, ci: number) => {
    if (locked) return;
    const next = layout.map((r) => [...r]);
    while (next[ri].length < colCount) next[ri].push(null);
    const cur = next[ri][ci];
    if (tool === "seat") {
      next[ri][ci] = cur && cur !== "driver" ? null : "TMP";
    } else if (tool === "aisle") {
      next[ri][ci] = null;
    } else if (tool === "driver") {
      // Only one driver allowed
      next.forEach((row, i) =>
        row.forEach((c, j) => {
          if (c === "driver") next[i][j] = null;
        })
      );
      next[ri][ci] = "driver";
    }
    update(next);
  };

  const addRow = () => {
    if (locked) return;
    update([...layout, Array.from({ length: colCount }, () => null as SeatCell)]);
  };

  const removeRow = (ri: number) => {
    if (locked) return;
    update(layout.filter((_, i) => i !== ri));
  };

  const addColumn = () => {
    if (locked) return;
    update(layout.map((r) => [...r, null as SeatCell]));
  };

  const removeColumn = (ci: number) => {
    if (locked) return;
    if (colCount <= 1) return;
    update(
      layout.map((r) => {
        const padded = [...r];
        while (padded.length < colCount) padded.push(null);
        return padded.filter((_, i) => i !== ci);
      })
    );
  };

  const reset = () => {
    if (locked) return;
    update(defaultLayout(cols));
  };

  const seatCount = layout.flat().filter((c) => c && c !== "driver").length;

  return (
    <div className="space-y-4">
      {/* Tool palette */}
      <div className="flex flex-wrap items-center gap-2">
        <ToolButton
          active={tool === "seat"}
          onClick={() => setTool("seat")}
          color="brand"
        >
          Seat
        </ToolButton>
        <ToolButton
          active={tool === "aisle"}
          onClick={() => setTool("aisle")}
          color="ink"
        >
          Aisle / Empty
        </ToolButton>
        <ToolButton
          active={tool === "driver"}
          onClick={() => setTool("driver")}
          color="amber"
        >
          Driver
        </ToolButton>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={locked}
            onClick={addRow}
            className="btn-secondary text-xs h-9 px-3"
          >
            <Plus className="h-3.5 w-3.5" /> Row
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={addColumn}
            className="btn-secondary text-xs h-9 px-3"
          >
            <Plus className="h-3.5 w-3.5" /> Column
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={reset}
            className="btn-ghost text-xs h-9 px-3"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {locked && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Layout locked — bookings exist for this template. Clone to a new
          template to make changes.
        </div>
      )}

      {/* Builder grid + Preview */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-3xl border border-ink-200 bg-gradient-to-b from-ink-50/60 to-white p-5">
          <p className="text-xs uppercase tracking-widest text-ink-400 font-semibold mb-3">
            Builder
          </p>
          {/* Column header with remove buttons */}
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6" />
            <div
              className="grid gap-1.5 flex-1"
              style={{
                gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: colCount }).map((_, ci) => (
                <button
                  key={ci}
                  type="button"
                  disabled={locked || colCount <= 1}
                  onClick={() => removeColumn(ci)}
                  className="aspect-square rounded-lg flex items-center justify-center text-ink-300 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-300 transition"
                  aria-label={`Remove column ${ci + 1}`}
                  title={`Remove column ${ci + 1}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              ))}
            </div>
            <span className="w-3.5" />
          </div>
          <div className="space-y-2">
            {layout.map((row, ri) => (
              <div key={ri} className="flex items-center gap-2">
                <span className="w-6 text-[10px] text-ink-400 text-right">
                  {ri + 1}
                </span>
                <div
                  className="grid gap-1.5 flex-1"
                  style={{
                    gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: colCount }).map((_, ci) => {
                    const cell = row[ci] ?? null;
                    return (
                      <button
                        key={ci}
                        type="button"
                        disabled={locked}
                        onClick={() => setCell(ri, ci)}
                        className={cn(
                          "aspect-square rounded-lg border text-[10px] font-bold flex items-center justify-center transition",
                          cell === "driver" &&
                            "bg-amber-50 border-amber-300 text-amber-700",
                          cell === null &&
                            "bg-ink-50/40 border-dashed border-ink-200 text-ink-300 hover:border-brand-300",
                          cell &&
                            cell !== "driver" &&
                            "bg-white border-brand-300 text-brand-700 shadow-soft hover:border-brand-500",
                          locked && "cursor-not-allowed opacity-70"
                        )}
                      >
                        {cell === "driver" ? (
                          <Steering className="h-3.5 w-3.5" />
                        ) : (
                          cell ?? "·"
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => removeRow(ri)}
                  className="text-ink-400 hover:text-rose-600 disabled:opacity-30"
                  aria-label="Remove row"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-ink-200 bg-white p-5">
          <p className="text-xs uppercase tracking-widest text-ink-400 font-semibold mb-3">
            Preview · {seatCount} seats
          </p>
          <PreviewLayout layout={layout} />
        </div>
      </div>
    </div>
  );
}

function PreviewLayout({ layout }: { layout: SeatLayout }) {
  const cols = Math.max(...layout.map((r) => r.length));
  return (
    <div className="mx-auto max-w-xs">
      <div className="rounded-t-[2rem] border border-ink-200 border-b-0 h-8 mb-1" />
      <div
        className="grid gap-1.5 p-3 border border-ink-200 rounded-b-3xl"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {layout.flatMap((row, ri) =>
          Array.from({ length: cols }).map((_, ci) => {
            const cell = row[ci] ?? null;
            if (cell === "driver")
              return (
                <div
                  key={`${ri}-${ci}`}
                  className="aspect-square rounded-md border border-amber-300 bg-amber-50 flex items-center justify-center text-amber-600"
                >
                  <Steering className="h-3 w-3" />
                </div>
              );
            if (!cell)
              return (
                <div
                  key={`${ri}-${ci}`}
                  className="aspect-square rounded-md"
                />
              );
            return (
              <motion.div
                key={`${ri}-${ci}`}
                layout
                className="aspect-square rounded-md border border-brand-200 bg-brand-50 text-brand-700 text-[9px] font-bold flex items-center justify-center"
              >
                {cell}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color: "brand" | "ink" | "amber";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-xs font-medium transition",
        active
          ? color === "brand"
            ? "border-brand-500 bg-brand-50 text-brand-700"
            : color === "amber"
              ? "border-amber-400 bg-amber-50 text-amber-700"
              : "border-ink-400 bg-ink-100 text-ink-700"
          : "border-ink-200 hover:border-ink-300 text-ink-600"
      )}
    >
      {children}
    </button>
  );
}
