import { useEffect, useRef, ReactNode } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  children: ReactNode;
  className?: string;
}

/**
 * Renders text with LaTeX math notation using KaTeX
 * Supports inline math: \( ... \) or $ ... $
 * Supports display math: \[ ... \] or $$ ... $$
 */
export const MathText = ({ children, className = '' }: MathTextProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Get text content from children
    const textContent = containerRef.current.textContent || '';
    if (!textContent) return;

    try {
      // Replace LaTeX delimiters with rendered math
      let html = textContent;

      // Display math: \[ ... \] or $$ ... $$
      html = html.replace(/\\\[(.*?)\\\]/gs, (match, math) => {
        try {
          return katex.renderToString(math, { displayMode: true, throwOnError: false });
        } catch (e) {
          return match;
        }
      });

      html = html.replace(/\$\$(.*?)\$\$/gs, (match, math) => {
        try {
          return katex.renderToString(math, { displayMode: true, throwOnError: false });
        } catch (e) {
          return match;
        }
      });

      // Inline math: \( ... \) or $ ... $
      html = html.replace(/\\\((.*?)\\\)/g, (match, math) => {
        try {
          return katex.renderToString(math, { displayMode: false, throwOnError: false });
        } catch (e) {
          return match;
        }
      });

      html = html.replace(/\$(.+?)\$/g, (match, math) => {
        try {
          return katex.renderToString(math, { displayMode: false, throwOnError: false });
        } catch (e) {
          return match;
        }
      });

      // Only update if there were LaTeX expressions
      if (html !== textContent) {
        containerRef.current.innerHTML = html;
      }
    } catch (error) {
      console.error('Error rendering math:', error);
    }
  }, [children]);

  return <span ref={containerRef} className={className}>{children}</span>;
};