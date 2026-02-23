"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "motion-effects-enabled";
const MAX_POINTS = 16;
const LERP = 0.2;

type Point = { x: number; y: number };

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointBufferRef = useRef<Point[]>(Array.from({ length: MAX_POINTS }, () => ({ x: 0, y: 0 })));
  const pointCountRef = useRef(0);
  const writeIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef<Point | null>(null);
  const smoothedRef = useRef<Point | null>(null);

  const [motionEnabled, setMotionEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === null ? true : saved === "true";
  });
  const [supportsPointerTrail, setSupportsPointerTrail] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(motionEnabled));
  }, [motionEnabled]);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    const updateCapabilities = () => {
      setPrefersReducedMotion(reducedMotionQuery.matches);
      setSupportsPointerTrail(finePointerQuery.matches);
    };

    reducedMotionQuery.addEventListener("change", updateCapabilities);
    finePointerQuery.addEventListener("change", updateCapabilities);

    return () => {
      reducedMotionQuery.removeEventListener("change", updateCapabilities);
      finePointerQuery.removeEventListener("change", updateCapabilities);
    };
  }, []);

  const shouldAnimate = useMemo(
    () => motionEnabled && supportsPointerTrail && !prefersReducedMotion,
    [motionEnabled, prefersReducedMotion, supportsPointerTrail],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const addPoint = (point: Point) => {
      pointBufferRef.current[writeIndexRef.current] = point;
      writeIndexRef.current = (writeIndexRef.current + 1) % MAX_POINTS;
      pointCountRef.current = Math.min(pointCountRef.current + 1, MAX_POINTS);
    };

    const draw = () => {
      if (!shouldAnimate) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const pointer = pointerRef.current;
      if (!pointer) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const current = smoothedRef.current ?? pointer;
      const next = {
        x: current.x + (pointer.x - current.x) * LERP,
        y: current.y + (pointer.y - current.y) * LERP,
      };
      smoothedRef.current = next;
      addPoint(next);

      context.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < pointCountRef.current; i += 1) {
        const idx = (writeIndexRef.current - 1 - i + MAX_POINTS) % MAX_POINTS;
        const point = pointBufferRef.current[idx];
        const t = 1 - i / MAX_POINTS;
        const radius = 1.5 + t * 4;
        const alpha = 0.06 + t * 0.18;

        context.beginPath();
        context.fillStyle = `rgba(99, 102, 241, ${alpha})`;
        context.shadowBlur = 8;
        context.shadowColor = "rgba(99, 102, 241, 0.4)";
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
      }

      context.shadowBlur = 0;
      rafRef.current = window.requestAnimationFrame(draw);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerLeave = () => {
      pointerRef.current = null;
      smoothedRef.current = null;
      pointCountRef.current = 0;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);

    if (shouldAnimate) {
      rafRef.current = window.requestAnimationFrame(draw);
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [shouldAnimate]);

  const disabledReason = prefersReducedMotion
    ? "Disabled by your reduced-motion setting"
    : !supportsPointerTrail
      ? "Available on mouse/trackpad devices"
      : null;

  return (
    <>
      <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <label htmlFor="motion-effects" className="font-medium text-zinc-700 dark:text-zinc-300">
          Motion effects
        </label>
        <input
          id="motion-effects"
          type="checkbox"
          checked={motionEnabled}
          onChange={(event) => setMotionEnabled(event.target.checked)}
          className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
          aria-describedby="motion-effects-note"
        />
        <span id="motion-effects-note" className="text-xs">
          {disabledReason ?? "Cursor trail"}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10"
      />
    </>
  );
}
