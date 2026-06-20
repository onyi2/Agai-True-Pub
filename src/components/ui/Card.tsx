import React from "react";
import { cn } from "../../lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-[#15181E] rounded-xl border border-gray-800 p-6 shadow-2xl", className)} {...props}>
      {children}
    </div>
  );
}
