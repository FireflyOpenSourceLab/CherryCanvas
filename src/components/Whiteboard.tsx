import { useState } from "react";
import { InkCanvas } from "./InkCanvas";
import { DockToolbar, type Tool } from "./DockToolbar";
import type { StrokeData } from "./TitleBar";

interface WhiteboardProps {
  tabId: string;
  pageIndex: number;
  strokes: StrokeData[];
  onStrokesChange: (strokes: StrokeData[]) => void;
}

export function Whiteboard({ tabId, pageIndex, strokes, onStrokesChange }: WhiteboardProps) {
  const [activeTool, setActiveTool] = useState<Tool>("pen");

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
        cursor={activeTool === "cursor" ? "cursor-default" : "cursor-crosshair"}
        disabled={activeTool === "cursor"}
      />
      {/* 底部工具栏 */}
      <DockToolbar activeTool={activeTool} onToolChange={setActiveTool} />
    </div>
  );
}
