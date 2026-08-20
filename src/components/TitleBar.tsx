import { X, Home, Plus, Minus, Square } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";

const isMacOS =
  typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");

export interface StrokeData {
  points: number[][];
  color: string;
  size: number;
}

export interface Tab {
  id: string;
  title: string;
  pages: StrokeData[][];
  currentPage: number;
  savedPath?: string;
}

export type ActiveView =
  | { type: "home" }
  | { type: "tab"; id: string; title: string }
  | { type: "settings" };

interface TitleBarProps {
  activeView: ActiveView;
  tabs: Tab[];
  onViewChange: (view: ActiveView) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  onRenameTab: (id: string, title: string) => void;
  onExportTab: (id: string) => void;
}

export function TitleBar({
  activeView,
  tabs,
  onViewChange,
  onAddTab,
  onCloseTab,
  onRenameTab,
  onExportTab,
}: TitleBarProps) {
  const isHome = activeView.type === "home";
  const isSettings = activeView.type === "settings";

  return (
    <div className="fixed top-0 left-0 right-0 h-10 z-50 flex items-end bg-background border-b border-border select-none">
      {/* Home button */}
      <button
        onClick={() => onViewChange({ type: "home" })}
        className={`flex items-center justify-center h-8 w-8 ${isMacOS ? "ml-[71px]" : "ml-1"} mb-1 rounded-[5px] transition-colors shrink-0 z-10 ${
          isHome
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Home className="size-4" />
      </button>

      {/* drag region behind traffic lights */}
      <div data-tauri-drag-region className={`absolute inset-y-0 ${isMacOS ? "left-20 right-0" : "left-10 right-[133px]"}`} />

      {/* tabs */}
      <div className="flex items-end h-full ml-1 gap-px overflow-x-auto z-10">
        {tabs.map((tab) => (
          <ContextMenu key={tab.id}>
            <ContextMenuTrigger
              onClick={() =>
                onViewChange({ type: "tab", id: tab.id, title: tab.title })
              }
              className={`
                group relative flex items-center gap-1.5 h-8 px-3 mb-1
                rounded-[5px] cursor-pointer text-sm
                transition-colors shrink-0
                ${
                  activeView.type === "tab" && activeView.id === tab.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }
              `}
            >
              <span className="truncate max-w-[120px]">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="ml-0.5 rounded-sm p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-opacity"
              >
                <X className="size-3" />
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => onRenameTab(tab.id, tab.title)}>
                重命名
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onExportTab(tab.id)}>
                导出
              </ContextMenuItem>
              <ContextMenuItem
                variant="destructive"
                onClick={() => onCloseTab(tab.id)}
              >
                关闭
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}

        {/* settings tab */}
        {isSettings && (
          <div
            onClick={() => onViewChange({ type: "settings" })}
            className="group relative flex items-center gap-1.5 h-8 px-3 mb-1 rounded-[5px] cursor-pointer text-sm transition-colors shrink-0 bg-muted text-foreground"
          >
            <span className="truncate max-w-[120px]">设置</span>
          </div>
        )}

        {/* add tab button */}
        <button
          onClick={onAddTab}
          className="flex items-center justify-center h-8 w-8 mb-1 rounded-[5px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {/* Windows/Linux window controls */}
      {!isMacOS && (
        <div className="ml-auto flex items-stretch shrink-0 z-10">
          <button
            onClick={() => getCurrentWindow().minimize()}
            className="flex items-center justify-center w-11 h-8 mb-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <Minus className="size-4" />
          </button>
          <button
            onClick={() => getCurrentWindow().toggleMaximize()}
            className="flex items-center justify-center w-11 h-8 mb-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <Square className="size-3.5" />
          </button>
          <button
            onClick={() => getCurrentWindow().close()}
            className="flex items-center justify-center w-11 h-8 mb-1 text-muted-foreground hover:bg-red-500 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
