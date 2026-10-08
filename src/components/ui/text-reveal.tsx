"use client";

import { motion } from "framer-motion";
import type { ElementType } from "react";

interface TextRevealProps {
  text: string;
  as?: ElementType;
  delay?: number;
  stagger?: number;
  className?: string;
}

export default function TextReveal({
  text,
  as: Tag = "p",
  delay = 0,
  stagger = 0.04,
  className,
}: TextRevealProps): React.JSX.Element {
  const words = text.split(/\s+/).filter(Boolean);

  const MotionTag = motion(Tag as ElementType);

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="inline-block break-words"
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </MotionTag>
  );
}

export { TextReveal };
export type { TextRevealProps };
