'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyWidgetProps {
  children: React.ReactNode;
  delay?: number;
  threshold?: number;
  className?: string;
}

/**
 * LazyWidget component - loads widgets only when they're visible in viewport
 * Uses IntersectionObserver for efficient viewport detection
 */
export function LazyWidget({ 
  children, 
  delay = 0, 
  threshold = 0.1,
  className = '' 
}: LazyWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold,
        rootMargin: '50px', // Load slightly before entering viewport
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold]);

  // Add delay before loading to stagger requests
  useEffect(() => {
    if (isVisible && !shouldLoad) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          setShouldLoad(true);
        }, delay);
        return () => clearTimeout(timer);
      } else {
        setShouldLoad(true);
      }
    }
  }, [isVisible, delay, shouldLoad]);

  return (
    <div ref={elementRef} className={className}>
      {shouldLoad ? (
        children
      ) : (
        <div className="flex items-center justify-center h-[400px] bg-card rounded-lg border">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading widget...</p>
          </div>
        </div>
      )}
    </div>
  );
}
