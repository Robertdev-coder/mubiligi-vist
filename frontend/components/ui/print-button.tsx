"use client";

import { Printer } from "lucide-react";
import { Button, type ButtonProps } from "@/frontend/components/ui/button";

export function PrintButton({
  label = "Print",
  ...props
}: { label?: string } & Omit<ButtonProps, "onClick" | "children">) {
  return (
    <Button type="button" onClick={() => window.print()} {...props}>
      <Printer />
      {label}
    </Button>
  );
}
