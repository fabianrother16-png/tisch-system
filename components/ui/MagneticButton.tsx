"use client";

import { useRef, type ComponentProps, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { Button, ButtonLink } from "./Button";

const SPRING = { stiffness: 150, damping: 14, mass: 0.2 };
const STRENGTH = 0.35;
const MAX_OFFSET = 14;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function useMagnetic(disabled: boolean) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  function handleMouseMove(event: MouseEvent<HTMLSpanElement>) {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = event.clientX - (rect.left + rect.width / 2);
    const relY = event.clientY - (rect.top + rect.height / 2);
    x.set(clamp(relX * STRENGTH, -MAX_OFFSET, MAX_OFFSET));
    y.set(clamp(relY * STRENGTH, -MAX_OFFSET, MAX_OFFSET));
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return { ref, springX, springY, handleMouseMove, handleMouseLeave };
}

export function MagneticButtonLink(props: ComponentProps<typeof ButtonLink>) {
  const reduceMotion = useReducedMotion();
  const { ref, springX, springY, handleMouseMove, handleMouseLeave } = useMagnetic(
    !!reduceMotion
  );

  return (
    <motion.span
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY, display: "inline-block" }}
    >
      <ButtonLink {...props} />
    </motion.span>
  );
}

export function MagneticButton(props: ComponentProps<typeof Button>) {
  const reduceMotion = useReducedMotion();
  const { ref, springX, springY, handleMouseMove, handleMouseLeave } = useMagnetic(
    !!reduceMotion
  );

  return (
    <motion.span
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY, display: "inline-block" }}
    >
      <Button {...props} />
    </motion.span>
  );
}
