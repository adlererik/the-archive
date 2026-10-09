"use client";

import { useRef, type PointerEvent, type MouseEvent } from "react";

// Erik Adler: share the same left-to-next gesture across the wall and viewers.
export function useMediaSwipe({ enabled = true, onPrevious, onNext, canStart }: {
  enabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  canStart?: (event: PointerEvent<HTMLDivElement>) => boolean;
}) {
  const start = useRef<{ id: number; x: number; y: number; at: number } | null>(null);
  const suppressClick = useRef(false);
  return {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      start.current = null;
      suppressClick.current = false;
      if (!event.isPrimary || event.button !== 0) { start.current = null; return; }
      if (!enabled || (canStart && !canStart(event))) return;
      start.current = { id: event.pointerId, x: event.clientX, y: event.clientY, at: Date.now() };
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      const point = start.current;
      if (!point || point.id !== event.pointerId) return;
      const dx = event.clientX - point.x; const dy = event.clientY - point.y;
      if (Math.abs(dy) > 30 && Math.abs(dy) > Math.abs(dx)) { start.current = null; return; }
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        suppressClick.current = true;
        // Mouse drags may leave the media; touch already has implicit capture.
        if (event.pointerType === "mouse" && !event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    onPointerUp(event: PointerEvent<HTMLDivElement>) {
      const point = start.current; start.current = null;
      if (!point || point.id !== event.pointerId || Date.now() - point.at > 1500) return;
      const dx = event.clientX - point.x; const dy = event.clientY - point.y;
      if (Math.abs(dx) <= 60 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
      suppressClick.current = true;
      if (dx < 0) onNext(); else onPrevious();
    },
    onPointerCancel() { start.current = null; suppressClick.current = false; },
    onClickCapture(event: MouseEvent<HTMLDivElement>) {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      event.preventDefault(); event.stopPropagation();
    },
  };
}
