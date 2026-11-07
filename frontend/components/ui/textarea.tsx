import * as React from "react";
import { cn } from "@/shared/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex min-h-[108px] w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink shadow-[inset_0_1px_2px_rgba(7,26,61,0.04)] transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-slate-50",
        invalid && "border-danger/60 focus:border-danger focus:ring-danger/10",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
