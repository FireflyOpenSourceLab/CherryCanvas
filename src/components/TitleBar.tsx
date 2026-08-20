import { X, Home, Plus } from "lucide-react";

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
}

export function TitleBar({ activeView, tabs, onViewChange, onAddTab, onCloseTab }: TitleBarProps) {
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
      <div data-tauri-drag-region className="absolute inset-y-0 left-20 right-0" />

      {/* tabs */}
      <div className="flex items-end h-full ml-1 gap-px overflow-x-auto z-10">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onViewChange({ type: "tab", id: tab.id, title: tab.title })}
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
          </div>
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
    </div>
  );
}
