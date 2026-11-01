import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "purple" | "emerald" | "amber" | "rose" | "blue" | "slate" | "gold";
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "gold", children, ...props }) => {
  const styles = {
    gold: "bg-[#1C1811] text-[#E5CA9E] border-[#C5A880]/30",
    purple: "bg-[#181420] text-[#D4C2F0] border-[#9B80C8]/30",
    emerald: "bg-[#0E1A16] text-[#7CE4B5] border-[#10B981]/30",
    amber: "bg-[#1C160C] text-[#F3C76F] border-[#F59E0B]/30",
    rose: "bg-[#201014] text-[#F692A2] border-[#F43F5E]/30",
    blue: "bg-[#0E1724] text-[#8AC1F5] border-[#38BDF8]/30",
    slate: "bg-[#13151A] text-slate-300 border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border tracking-wider uppercase",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
