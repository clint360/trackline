"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, error, hint, children, className }: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && <label className="label">{label}</label>}
      {children}
      {error ? (
        <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
          <span className="inline-block h-1 w-1 rounded-full bg-rose-500" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-500 mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "input",
        invalid && "border-rose-300 focus:border-rose-500 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.12)]",
        className
      )}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "input appearance-none bg-no-repeat pr-10",
        invalid && "border-rose-300 focus:border-rose-500",
        className
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
        backgroundPosition: "right 0.75rem center",
        backgroundSize: "1.25rem",
      }}
      {...props}
    >
      {children}
    </select>
  );
});
