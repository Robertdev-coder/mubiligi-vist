import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, invalid, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-11 w-full appearance-none rounded-xl border border-line bg-white px-3.5 pr-10 text-sm text-ink shadow-[inset_0_1px_2px_rgba(7,26,61,0.04)] transition-all hover:border-slate-300 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70",
          invalid && "border-danger/60 focus:border-danger focus:ring-danger/10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
    </div>
  ),
);
Select.displayName = "Select";

export { Select };
