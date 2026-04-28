"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepDef {
  key: string;
  label: string;
}

export function StepIndicator({
  steps,
  current,
}: {
  steps: StepDef[];
  current: number;
}) {
  return (
    <ol className="flex items-start w-full">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === steps.length - 1;
        const reachedNext = i < current; // line after this bubble fills if next bubble is reached
        return (
          <li
            key={s.key}
            className={cn(
              "flex items-start min-w-0",
              isLast ? "flex-initial" : "flex-1"
            )}
          >
            {/* Bubble + label column */}
            <div className="flex flex-col items-center min-w-0">
              <motion.div
                initial={false}
                animate={{
                  scale: active ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 rounded-full border-2 flex items-center justify-center text-xs font-semibold shrink-0 transition-colors duration-300",
                  done && "bg-brand-600 border-brand-600 text-white",
                  active &&
                    "bg-brand-600 border-brand-600 text-white shadow-glow",
                  !done && !active && "bg-white border-ink-200 text-ink-400"
                )}
              >
                {done ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 320,
                      damping: 20,
                    }}
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </motion.span>
                ) : (
                  <span>{i + 1}</span>
                )}
              </motion.div>
              <span
                className={cn(
                  "mt-1.5 text-[10px] sm:text-xs font-medium truncate w-full text-center max-w-[5.5rem] sm:max-w-[7rem]",
                  active && "text-brand-700 font-semibold",
                  done && "text-ink-700",
                  !done && !active && "text-ink-400"
                )}
              >
                {s.label}
              </span>
            </div>

            {/* Connector to next bubble */}
            {!isLast && (
              <div className="flex-1 mt-4 sm:mt-[18px] mx-1.5 sm:mx-2 h-[3px] rounded-full bg-ink-100 overflow-hidden self-start">
                <motion.div
                  className="h-full bg-brand-600 origin-left"
                  initial={false}
                  animate={{ scaleX: reachedNext ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  style={{ width: "100%" }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
