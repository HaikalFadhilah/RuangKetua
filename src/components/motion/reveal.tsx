"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.55, ease: easeOut },
  }),
};

const staggerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

type RevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
};

type RevealSectionProps = HTMLMotionProps<"section"> & {
  children: ReactNode;
  delay?: number;
};

export function Reveal({ children, delay = 0, ...props }: RevealProps) {
  return (
    <motion.div
      variants={revealVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.22 }}
      custom={delay}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function RevealSection({ children, delay = 0, ...props }: RevealSectionProps) {
  return (
    <motion.section
      variants={revealVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
      custom={delay}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function Stagger({ children, ...props }: HTMLMotionProps<"div"> & { children: ReactNode }) {
  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, delay = 0, ...props }: RevealProps) {
  return (
    <motion.div variants={revealVariants} custom={delay} {...props}>
      {children}
    </motion.div>
  );
}
