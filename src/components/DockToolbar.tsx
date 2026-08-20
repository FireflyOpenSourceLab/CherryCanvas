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
import { cn } from "@/lib/utils";

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
}

const tools: { id: Tool; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: "cursor", icon: MousePointer2, label: "鼠标" },
  { id: "pen", icon: Pen, label: "笔" },
  { id: "eraser", icon: Eraser, label: "橡皮" },
  { id: "text", icon: Type, label: "文字" },
  { id: "mindmap", icon: Network, label: "思维导图" },
  { id: "shape", icon: Circle, label: "图形" },
];

export function DockToolbar({ activeTool, onToolChange }: DockToolbarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm border border-border rounded-[10px] px-1.5 py-1 shadow-sm select-none">
      {tools.map((tool) => {
        const Icon = tool.icon;
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
            onClick={() => onToolChange(tool.id)}
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
