"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";

export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy. Please copy it manually.");
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} className={className}>
      {copied ? <Check className="text-success" /> : <Copy />}
      {copied ? "Copied" : label}
    </Button>
  );
}
