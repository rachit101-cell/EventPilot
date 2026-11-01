import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-[11px] font-medium tracking-wider uppercase text-slate-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full bg-[#101217]/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#C5A880]/70 focus:ring-1 focus:ring-[#C5A880]/40 transition-colors duration-150 disabled:opacity-50",
            error && "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
