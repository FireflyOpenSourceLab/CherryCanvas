import { useState, useCallback } from "react";
import { InkCanvas } from "./InkCanvas";
import { DockToolbar, type Tool } from "./DockToolbar";
import { type PenSettings } from "./PenMenu";
import { type EraserSettings } from "./EraserMenu";
import type { StrokeData } from "./TitleBar";

interface WhiteboardProps {
  tabId: string;
  pageIndex: number;
  strokes: StrokeData[];
  onStrokesChange: (strokes: StrokeData[]) => void;
}

export function Whiteboard({ tabId, pageIndex, strokes, onStrokesChange }: WhiteboardProps) {
  const [activeTool, setActiveTool] = useState<Tool>("pen");
  const [penSettings, setPenSettings] = useState<PenSettings>({
    color: "#000000",
    size: 3,
    opacity: 100,
    penType: "normal",
  });
  const [eraserSettings, setEraserSettings] = useState<EraserSettings>({
    size: 20,
  });

  const strokeColor =
    penSettings.penType === "highlighter"
      ? hexToRgba(penSettings.color, penSettings.opacity / 100 * 0.4)
      : hexToRgba(penSettings.color, penSettings.opacity / 100);

  const handleClearPage = useCallback(() => {
    onStrokesChange([]);
  }, [onStrokesChange]);

  return (
    <div className="h-full w-full relative overflow-hidden bg-background">
      {/* 点阵背景 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--foreground) 0.8px, transparent 0.8px)",
          backgroundSize: "24px 24px",
          opacity: 0.12,
        }}
      />
      {/* 绘画层 */}
      <InkCanvas
        key={`${tabId}-${pageIndex}`}
        strokes={strokes}
        onStrokesChange={onStrokesChange}
        cursor={
          activeTool === "cursor"
            ? "cursor-default"
            : activeTool === "eraser"
              ? "cursor-none"
              : "cursor-crosshair"
        }
        color={strokeColor}
        size={penSettings.size}
        tool={activeTool}
        eraserSize={eraserSettings.size}
      />
      {/* 底部工具栏 */}
      <DockToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        penSettings={penSettings}
        onPenSettingsChange={setPenSettings}
        eraserSettings={eraserSettings}
        onEraserSettingsChange={setEraserSettings}
        onClearPage={handleClearPage}
      />
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
