import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary-500 to-primary text-white shadow-[0_8px_20px_-8px_rgba(20,86,160,0.65)] hover:from-primary hover:to-primary-600 hover:shadow-[0_10px_26px_-8px_rgba(20,86,160,0.75)]",
        navy: "bg-navy text-white shadow-[0_8px_20px_-10px_rgba(7,26,61,0.7)] hover:bg-navy-800",
        secondary: "bg-sky-soft text-primary hover:bg-[#dbeaff]",
        outline:
          "border border-line bg-white text-ink shadow-sm hover:border-primary/30 hover:bg-surface hover:text-primary",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-navy",
        destructive:
          "bg-danger text-white shadow-[0_8px_20px_-10px_rgba(220,38,38,0.7)] hover:bg-red-700",
        success:
          "bg-success text-white shadow-[0_8px_20px_-10px_rgba(22,163,74,0.7)] hover:bg-green-700",
        warning: "bg-warning text-white shadow-[0_8px_20px_-10px_rgba(245,158,11,0.7)] hover:bg-amber-600",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-lg px-3.5 text-[13px]",
        lg: "h-12 rounded-xl px-7 text-[15px]",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
