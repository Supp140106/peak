import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-neutral-200 rounded-full px-7 py-3",
        destructive: "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 rounded-full px-7 py-3",
        outline: "border border-[#2a2a2a] text-neutral-300 hover:border-neutral-600 hover:text-white rounded-full px-7 py-3",
        secondary: "bg-[#1a1a1a] text-neutral-300 hover:bg-[#2a2a2a] rounded-full px-7 py-3",
        ghost: "text-neutral-400 hover:text-white transition-colors duration-200 rounded-full px-7 py-3",
        link: "text-[var(--accent)] underline-offset-4 hover:underline",
        pill: "bg-white text-black hover:bg-neutral-200 rounded-full px-5 py-2 text-sm font-medium",
      },
      size: {
        default: "h-10 px-7 py-3",
        sm: "h-9 px-5 py-2",
        lg: "h-11 px-8 py-3",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
