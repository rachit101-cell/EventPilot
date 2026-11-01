import React from "react";
import { cn } from "@/lib/utils";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn("glass-card rounded-2xl p-6 relative overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
};
