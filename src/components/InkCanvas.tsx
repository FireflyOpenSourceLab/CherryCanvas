import { useRef, useCallback, useEffect, useState } from "react";
import getStroke from "perfect-freehand";
import type { StrokeData } from "./TitleBar";
import type { Tool } from "./DockToolbar";

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

type Point3 = [number, number, number];

function dist(a: [number, number], b: [number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function pointToLineDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist([px, py], [x1, y1]);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return dist([px, py], [x1 + t * dx, y1 + t * dy]);
}

function detectLine(points: Point3[]): Point3[] | null {
  if (points.length < 2) return null;
  const [x1, y1] = points[0];
  const [x2, y2] = points[points.length - 1];
  const lineLen = dist([x1, y1], [x2, y2]);
  if (lineLen < 20) return null;

  let maxDev = 0;
  for (const [px, py] of points) {
    const d = pointToLineDist(px, py, x1, y1, x2, y2);
    if (d > maxDev) maxDev = d;
  }

  if (maxDev < lineLen * 0.08) {
    return [[x1, y1, points[0][2]], [x2, y2, points[points.length - 1][2]]];
  }
  return null;
}

function detectCircle(points: Point3[]): Point3[] | null {
  if (points.length < 12) return null;

  const first = points[0];
  const last = points[points.length - 1];
  if (dist([first[0], first[1]], [last[0], last[1]]) > dist([first[0], first[1]], [points[Math.floor(points.length / 2)][0], points[Math.floor(points.length / 2)][1]]) * 0.4) {
    return null;
  }

  let cx = 0, cy = 0;
  for (const [x, y] of points) { cx += x; cy += y; }
  cx /= points.length;
  cy /= points.length;

  let radius = 0;
  for (const [x, y] of points) {
    radius += dist([x, y], [cx, cy]);
  }
  radius /= points.length;

  if (radius < 15) return null;

  let maxDev = 0;
  for (const [x, y] of points) {
    const d = Math.abs(dist([x, y], [cx, cy]) - radius);
    if (d > maxDev) maxDev = d;
  }

  if (maxDev < radius * 0.15) {
    const n = 64;
    const result: Point3[] = [];
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      result.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 0.5]);
    }
    return result;
  }
  return null;
}

function correctShape(points: Point3[]): Point3[] {
  return detectLine(points) ?? detectCircle(points) ?? points;
}

function strokeBBox(points: number[][]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

function bboxIntersectsCircle(
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  cx: number,
  cy: number,
  r: number,
): boolean {
  const closestX = Math.max(bbox.minX, Math.min(cx, bbox.maxX));
  const closestY = Math.max(bbox.minY, Math.min(cy, bbox.maxY));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= r * r;
}

interface InkCanvasProps {
  strokes: StrokeData[];
  onStrokesChange: (strokes: StrokeData[]) => void;
  color?: string;
  size?: number;
  cursor?: string;
  tool?: Tool;
  eraserSize?: number;
}

export function InkCanvas({
  strokes,
  onStrokesChange,
  color = "#000000",
  size = 3,
  cursor = "cursor-crosshair",
  tool = "pen",
  eraserSize = 20,
}: InkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStroke = useRef<{ x: number; y: number; pressure: number }[]>(
    [],
  );
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const erasing = useRef(false);
  const penActive = useRef(false);
  const touchIds = useRef<number[]>([]);
  const lastTouchDist = useRef(0);
  const lastTouchCenter = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const isEraserMode = tool === "eraser";

  // Always-fresh ref to avoid stale closures
  const toolRef = useRef(tool);
  toolRef.current = tool;

  // Reset state when tool changes
  useEffect(() => {
    penActive.current = false;
    erasing.current = false;
    currentStroke.current = [];
    setEraserPos(null);
    setHoverPos(null);
  }, [tool]);

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

  const eraseAt = useCallback(
    (x: number, y: number) => {
      const r = eraserSize / 2;
      const remaining = strokesRef.current.filter((s) => {
        const bbox = strokeBBox(s.points);
        return !bboxIntersectsCircle(bbox, x, y, r);
      });
      if (remaining.length !== strokesRef.current.length) {
        onStrokesChange(remaining);
      }
    },
    [eraserSize, onStrokesChange],
  );

  // --- Pointer events (pen + mouse) ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const currentTool = toolRef.current;

      // Palm rejection: ignore touch when pen is nearby
      if (e.pointerType === "touch" && penActive.current) return;

      // Only allow pen and mouse for drawing/erasing
      if (e.pointerType !== "pen" && e.pointerType !== "mouse") return;

      // Cursor mode: no drawing, no erasing
      if (currentTool === "cursor") return;

      if (e.pointerType === "pen") penActive.current = true;

      const point = getCanvasPoint(e);

      if (currentTool === "eraser") {
        erasing.current = true;
        eraseAt(point.x, point.y);
        return;
      }

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
    [getCanvasPoint, color, size, eraseAt],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const currentTool = toolRef.current;

      // Pen hover preview
      if (e.pointerType === "pen" && e.buttons === 0) {
        setHoverPos({ x: e.clientX, y: e.clientY });
        return;
      }

      // Touch: handle pan/zoom with two fingers
      if (e.pointerType === "touch") return;

      // Cursor mode: no drawing
      if (currentTool === "cursor") return;

      const point = getCanvasPoint(e);

      if (currentTool === "eraser") {
        setEraserPos({ x: e.clientX, y: e.clientY });
        if (erasing.current) {
          eraseAt(point.x, point.y);
        }
        return;
      }

      if (e.buttons !== 1) return;
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
    [getCanvasPoint, redraw, color, size, eraseAt],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType === "pen") {
        penActive.current = false;
        setHoverPos(null);
      }
      erasing.current = false;
      setEraserPos(null);

      if (toolRef.current === "eraser" || toolRef.current === "cursor") return;
      if (currentStroke.current.length === 0) return;
      const raw = currentStroke.current.map((p) => [p.x, p.y, p.pressure] as Point3);
      const corrected = correctShape(raw);
      const stroke: StrokeData = {
        points: corrected,
        color,
        size,
      };
      onStrokesChange([...strokesRef.current, stroke]);
      currentStroke.current = [];
    },
    [color, size, onStrokesChange],
  );

  const handlePointerLeave = useCallback(() => {
    setEraserPos(null);
    setHoverPos(null);
    erasing.current = false;
    penActive.current = false;
    if (toolRef.current === "pen" && currentStroke.current.length > 0) {
      const raw = currentStroke.current.map((p) => [p.x, p.y, p.pressure] as Point3);
      const corrected = correctShape(raw);
      const stroke: StrokeData = {
        points: corrected,
        color,
        size,
      };
      onStrokesChange([...strokesRef.current, stroke]);
      currentStroke.current = [];
    }
  }, [color, size, onStrokesChange]);

  // --- Touch events (two-finger pan/zoom) ---
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touches = Array.from(e.touches);
      touchIds.current = touches.map((t) => t.identifier);

      if (touches.length === 2) {
        const [t1, t2] = touches;
        lastTouchDist.current = dist([t1.clientX, t1.clientY], [t2.clientX, t2.clientY]);
        lastTouchCenter.current = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
      }
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touches = Array.from(e.touches);
      if (touches.length === 2) {
        e.preventDefault();
        const [t1, t2] = touches;
        const newDist = dist([t1.clientX, t1.clientY], [t2.clientX, t2.clientY]);
        const newCenter = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };

        // Pan
        const dx = newCenter.x - lastTouchCenter.current.x;
        const dy = newCenter.y - lastTouchCenter.current.y;
        panOffset.current = { x: panOffset.current.x + dx, y: panOffset.current.y + dy };

        lastTouchDist.current = newDist;
        lastTouchCenter.current = newCenter;

        // Apply pan via CSS transform on parent
        const parent = canvasRef.current?.parentElement;
        if (parent) {
          parent.style.transform = `translate(${panOffset.current.x}px, ${panOffset.current.y}px)`;
        }
      }
    },
    [],
  );

  const handleTouchEnd = useCallback(() => {
    touchIds.current = [];
  }, []);

  // Clear hover when switching away from pen
  useEffect(() => {
    if (tool !== "pen") setHoverPos(null);
  }, [tool]);

  return (
    <div
      className="absolute inset-0"
      onTouchStart={isEraserMode ? undefined : handleTouchStart}
      onTouchMove={isEraserMode ? undefined : handleTouchMove}
      onTouchEnd={isEraserMode ? undefined : handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 touch-none ${cursor}`}
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />
      {/* 橡皮光标 */}
      {isEraserMode && eraserPos && (
        <div
          className="pointer-events-none fixed z-[100] border-2 border-muted-foreground/60 rounded-full -translate-x-1/2 -translate-y-1/2 bg-muted-foreground/10"
          style={{
            width: eraserSize,
            height: eraserSize,
            left: eraserPos.x,
            top: eraserPos.y,
          }}
        />
      )}
      {/* 画笔悬浮预览 */}
      {tool === "pen" && hoverPos && (
        <div
          className="pointer-events-none fixed z-[100] rounded-full -translate-x-1/2 -translate-y-1/2 border border-foreground/30"
          style={{
            width: size,
            height: size,
            left: hoverPos.x,
            top: hoverPos.y,
            backgroundColor: color,
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
}
