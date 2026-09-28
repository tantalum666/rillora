import { motion, useReducedMotion } from "motion/react";

export function Reveal({ children, className, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: reduce ? 0 : 0.28, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
