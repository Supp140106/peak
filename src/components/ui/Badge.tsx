import * as React from "react"
import { cn } from "@/utils/cn"

export const badgeVariants = {
  default: "bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-lighter)]",
  secondary: "border-[#2a2a2a] text-neutral-400",
  destructive: "bg-red-500/10 border-red-500/30 text-red-400",
  outline: "text-neutral-400 border-[#2a2a2a]",
  success: "bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-lighter)]",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-200",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
