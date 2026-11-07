import * as React from "react";
import { cn } from "@/shared/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-11 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm text-ink shadow-[inset_0_1px_2px_rgba(7,26,61,0.04)] transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70",
        invalid && "border-danger/60 focus:border-danger focus:ring-danger/10",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
