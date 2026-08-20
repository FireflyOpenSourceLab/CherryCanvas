import { Plus, FolderOpen, Settings } from "lucide-react";

interface HomePageProps {
  onNewBoard?: () => void;
  onOpenFile?: () => void;
  onSettings?: () => void;
}

export function HomePage({ onNewBoard, onOpenFile, onSettings }: HomePageProps) {
  return (
    <div className="h-full w-full flex">
      {/* 侧边栏 */}
      <aside className="w-56 h-full border-r border-border bg-background flex flex-col shrink-0 select-none">
        {/* logo */}
        <div className="px-4 pt-5 pb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
            <span className="text-background text-sm font-bold">CC</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">CherryCanvas</span>
            <span className="text-xs text-muted-foreground leading-tight">树莓白板</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="px-3 flex flex-col gap-1">
          <button
            onClick={onNewBoard}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[5px] text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Plus className="size-4 shrink-0" />
            <span>新建白板</span>
          </button>
          <button
            onClick={onOpenFile}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[5px] text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <FolderOpen className="size-4 shrink-0" />
            <span>打开文件</span>
          </button>
        </div>

        {/* 底部设置 */}
        <div className="mt-auto px-3 pb-3">
          <button
            onClick={onSettings}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[5px] text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="size-4 shrink-0" />
            <span>设置</span>
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 h-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">暂无最近打开的白板</p>
      </div>
    </div>
  );
}
