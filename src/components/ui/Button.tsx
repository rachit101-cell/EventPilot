import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none tracking-tight";

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-[#D8B98A] via-[#C5A880] to-[#A88856] text-[#0A0B0E] font-semibold hover:from-[#E4C99D] hover:via-[#D4B68D] hover:to-[#B69663] shadow-lg shadow-[#C5A880]/15 active:scale-[0.98] border border-[#F2DEBF]/30",
      gold:
        "bg-[#1A1813] text-[#E8D5B5] border border-[#C5A880]/40 hover:bg-[#25221B] hover:border-[#C5A880]/70 shadow-sm active:scale-[0.98]",
      secondary:
        "bg-[#14161C] text-slate-200 hover:bg-[#1A1D24] border border-white/10 hover:border-white/20 active:scale-[0.98]",
      outline:
        "border border-[#C5A880]/35 text-[#E6C79C] hover:bg-[#C5A880]/10 hover:border-[#C5A880]/60 active:scale-[0.98]",
      danger:
        "bg-rose-950/70 text-rose-200 hover:bg-rose-900/80 border border-rose-850/50 shadow-sm active:scale-[0.98]",
      ghost:
        "text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-xs sm:text-sm px-4 py-2 gap-2",
      lg: "text-sm sm:text-base px-6 py-2.5 sm:py-3 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
