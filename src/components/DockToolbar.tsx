import { useState, useEffect } from "react";
import {
  MousePointer2,
  Pen,
  Eraser,
  Type,
  Network,
  Circle,
  MoreHorizontal,
  Maximize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PenMenu, type PenSettings } from "./PenMenu";
import { EraserMenu, type EraserSettings } from "./EraserMenu";

export type Tool =
  | "cursor"
  | "pen"
  | "eraser"
  | "text"
  | "mindmap"
  | "shape"
  | "more"
  | "fullscreen";

interface DockToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  penSettings: PenSettings;
  onPenSettingsChange: (settings: PenSettings) => void;
  eraserSettings: EraserSettings;
  onEraserSettingsChange: (settings: EraserSettings) => void;
  onClearPage: () => void;
}

const tools: { id: Tool; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string }[] = [
  { id: "cursor", icon: MousePointer2, label: "鼠标" },
  { id: "pen", icon: Pen, label: "笔" },
  { id: "eraser", icon: Eraser, label: "橡皮" },
  { id: "text", icon: Type, label: "文字" },
  { id: "mindmap", icon: Network, label: "思维导图" },
  { id: "shape", icon: Circle, label: "图形" },
];

export function DockToolbar({
  activeTool,
  onToolChange,
  penSettings,
  onPenSettingsChange,
  eraserSettings,
  onEraserSettingsChange,
  onClearPage,
}: DockToolbarProps) {
  const [penOpen, setPenOpen] = useState(false);
  const [eraserOpen, setEraserOpen] = useState(false);

  // Close popovers when tool changes
  useEffect(() => {
    setPenOpen(false);
    setEraserOpen(false);
  }, [activeTool]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm border border-border rounded-[10px] px-1.5 py-1 shadow-sm select-none">
      {tools.map((tool) => {
        const Icon = tool.icon;

        if (tool.id === "pen") {
          return (
            <Popover key={tool.id} open={penOpen} onOpenChange={setPenOpen}>
              <PopoverTrigger render={<Button
                variant="ghost"
                size="icon"
                title={tool.label}
                className={cn(
                  "size-9 rounded-[6px]",
                  activeTool === tool.id && "bg-muted text-foreground"
                )}
                onClick={(e: React.MouseEvent) => {
                  if (activeTool !== "pen") {
                    e.preventDefault();
                    e.stopPropagation();
                    setEraserOpen(false);
                    onToolChange(tool.id);
                  } else {
                    setEraserOpen(false);
                  }
                }}
              />}>
                <Icon className="size-5" style={{ fill: penSettings.color, color: penSettings.color }} />
              </PopoverTrigger>
              <PopoverContent side="top" sideOffset={8} className="w-72 max-h-[70vh] overflow-y-auto">
                <PenMenu settings={penSettings} onChange={onPenSettingsChange} />
              </PopoverContent>
            </Popover>
          );
        }

        if (tool.id === "eraser") {
          return (
            <Popover key={tool.id} open={eraserOpen} onOpenChange={setEraserOpen}>
              <PopoverTrigger render={<Button
                variant="ghost"
                size="icon"
                title={tool.label}
                className={cn(
                  "size-9 rounded-[6px]",
                  activeTool === tool.id && "bg-muted text-foreground"
                )}
                onClick={(e: React.MouseEvent) => {
                  if (activeTool !== "eraser") {
                    e.preventDefault();
                    e.stopPropagation();
                    setPenOpen(false);
                    onToolChange(tool.id);
                  } else {
                    setPenOpen(false);
                  }
                }}
              />}>
                <Icon className="size-5" />
              </PopoverTrigger>
              <PopoverContent side="top" sideOffset={8} className="w-80">
                <EraserMenu
                  settings={eraserSettings}
                  onChange={onEraserSettingsChange}
                  onClearPage={onClearPage}
                />
              </PopoverContent>
            </Popover>
          );
        }

        return (
          <Button
            key={tool.id}
            variant="ghost"
            size="icon"
            title={tool.label}
            className={cn(
              "size-9 rounded-[6px]",
              activeTool === tool.id && "bg-muted text-foreground"
            )}
            onClick={() => {
              setPenOpen(false);
              setEraserOpen(false);
              onToolChange(tool.id);
            }}
          >
            <Icon className="size-5" />
          </Button>
        );
      })}
      <Separator orientation="vertical" className="mx-0.5 self-stretch" />
      <Button
        variant="ghost"
        size="icon"
        title="更多"
        className="size-9 rounded-[6px]"
        onClick={() => onToolChange("more")}
      >
        <MoreHorizontal className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="全屏"
        className="size-9 rounded-[6px]"
        onClick={() => onToolChange("fullscreen")}
      >
        <Maximize className="size-5" />
      </Button>
    </div>
  );
}
