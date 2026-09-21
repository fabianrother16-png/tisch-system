"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type RevealVariant = "up" | "scale" | "left" | "right";

const VARIANTS: Record<RevealVariant, Variants> = {
  up: {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
  },
  scale: {
    hidden: { opacity: 0, y: 20, scale: 0.94 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
  left: {
    hidden: { opacity: 0, x: -36 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 36 },
    visible: { opacity: 1, x: 0 },
  },
};

export function Reveal({
  children,
  delay = 0,
  className = "",
  variant = "up",
  duration = 0.7,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: RevealVariant;
  duration?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={VARIANTS[variant]}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
