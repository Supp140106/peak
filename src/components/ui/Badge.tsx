import { type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/utils/cn"

const badgeVariants = {
  default: "border-transparent bg-[var(--color-accent)] text-white shadow hover:bg-[var(--color-accent-hover)]",
  secondary: "border-transparent bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]",
  destructive: "border-transparent bg-[var(--color-danger)] text-white shadow hover:bg-[var(--color-danger)]/80",
  outline: "text-[var(--color-text-primary)]",
  success: "border-transparent bg-[var(--color-success-light)] text-[var(--color-success)]",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
