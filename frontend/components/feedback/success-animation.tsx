"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function SuccessAnimation() {
  return (
    <div className="relative flex size-24 items-center justify-center">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.12, 1], opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0 rounded-full bg-emerald-100"
      />
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 14 }}
        className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-[0_18px_40px_-16px_rgba(22,163,74,0.8)]"
      >
        <motion.span
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 12 }}
        >
          <Check className="size-8" strokeWidth={3} />
        </motion.span>
      </motion.span>
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.25, opacity: 0 }}
        transition={{ delay: 0.35, duration: 1.2, repeat: Infinity }}
        className="absolute inset-0 rounded-full border-2 border-emerald-400"
      />
    </div>
  );
}
