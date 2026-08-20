import { useRef, useCallback, useEffect } from "react";
import getStroke from "perfect-freehand";
import type { StrokeData } from "./TitleBar";

function getSvgPathFromStroke(stroke: number[][]): string {
  if (stroke.length === 0) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"],
  );
  d.push("Z");
  return d.join(" ");
}

interface InkCanvasProps {
  strokes: StrokeData[];
  onStrokesChange: (strokes: StrokeData[]) => void;
  color?: string;
  size?: number;
  cursor?: string;
  disabled?: boolean;
}

export function InkCanvas({
  strokes,
  onStrokesChange,
  color = "#000000",
  size = 3,
  cursor = "cursor-crosshair",
  disabled = false,
}: InkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStroke = useRef<{ x: number; y: number; pressure: number }[]>(
    [],
  );
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  // resize canvas to match container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement!;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      redraw(ctx, strokesRef.current);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement!);
    return () => observer.disconnect();
  }, []);

  // redraw when strokes prop changes (page switch)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    redraw(ctx, strokes);
  }, [strokes]);

  const redraw = useCallback(
    (ctx: CanvasRenderingContext2D, allStrokes: StrokeData[]) => {
      const canvas = ctx.canvas;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      for (const stroke of allStrokes) {
        const outline = getStroke(stroke.points, {
          size: stroke.size,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        });
        const path = new Path2D(getSvgPathFromStroke(outline));
        ctx.fillStyle = stroke.color;
        ctx.fill(path);
      }
    },
    [],
  );

  const getCanvasPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure,
      };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const point = getCanvasPoint(e);
      currentStroke.current = [point];

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const outline = getStroke([[point.x, point.y, point.pressure]], {
        size,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      });
      const path = new Path2D(getSvgPathFromStroke(outline));
      ctx.fillStyle = color;
      ctx.fill(path);
    },
    [getCanvasPoint, color, size],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.buttons !== 1) return;
      const point = getCanvasPoint(e);
      currentStroke.current.push(point);

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      redraw(ctx, strokesRef.current);

      const outline = getStroke(
        currentStroke.current.map((p) => [p.x, p.y, p.pressure]),
        {
          size,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        },
      );
      const path = new Path2D(getSvgPathFromStroke(outline));
      ctx.fillStyle = color;
      ctx.fill(path);
    },
    [getCanvasPoint, redraw, color, size],
  );

  const handlePointerUp = useCallback(() => {
    if (currentStroke.current.length === 0) return;
    const stroke: StrokeData = {
      points: currentStroke.current.map((p) => [p.x, p.y, p.pressure]),
      color,
      size,
    };
    onStrokesChange([...strokesRef.current, stroke]);
    currentStroke.current = [];
  }, [color, size, onStrokesChange]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 touch-none ${cursor} ${disabled ? "pointer-events-none" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
