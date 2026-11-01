import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "purple" | "emerald" | "amber" | "rose" | "blue" | "slate";
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "purple", children, ...props }) => {
  const styles = {
    purple: "bg-purple-950/70 text-purple-300 border-purple-800/60",
    emerald: "bg-emerald-950/70 text-emerald-300 border-emerald-800/60",
    amber: "bg-amber-950/70 text-amber-300 border-amber-800/60",
    rose: "bg-rose-950/70 text-rose-300 border-rose-800/60",
    blue: "bg-sky-950/70 text-sky-300 border-sky-800/60",
    slate: "bg-slate-800/80 text-slate-300 border-slate-700/60",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
