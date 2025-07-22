'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

type AnimatedCounterProps = {
  to: number;
  decimals?: number;
};

export function AnimatedCounter({ to, decimals = 0 }: AnimatedCounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(0, to, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate(value) {
        node.textContent = value.toFixed(decimals);
      },
    });

    return () => controls.stop();
  }, [to, decimals]);

  return <span ref={nodeRef} />;
}
