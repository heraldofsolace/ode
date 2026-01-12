'use client';

import { useEffect, useRef, useState } from 'react';
import katex from 'katex';

interface MathDisplayProps {
  math: string;
  display?: boolean;
  className?: string;
}

export function MathDisplay({ math, display = false, className = '' }: MathDisplayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (ref.current && isMounted) {
      // Clear previous content
      ref.current.innerHTML = '';
      katex.render(math, ref.current, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    }
  }, [math, display, isMounted]);

  // Always return the same structure to avoid hydration mismatch
  return <div ref={ref} className={className} suppressHydrationWarning />;
}

export function InlineMath({ math, className = '' }: { math: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (ref.current && isMounted) {
      // Clear previous content
      ref.current.innerHTML = '';
      katex.render(math, ref.current, {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
    }
  }, [math, isMounted]);

  // Use span for inline math to allow it inside <p> tags
  return <span ref={ref} className={className} suppressHydrationWarning />;
}

export function BlockMath({ math, className = '' }: { math: string; className?: string }) {
  return <MathDisplay math={math} display={true} className={className} />;
}

