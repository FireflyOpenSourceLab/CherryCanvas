import { useState, useEffect, useCallback } from "react";
import { Plus, FolderOpen, Settings } from "lucide-react";
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener";
import { remove } from "@tauri-apps/plugin-fs";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { getRecentFiles, removeRecentFile, formatFileSize, formatDate } from "@/lib/recent";
import type { RecentFile } from "@/lib/recent";

const isMac =
  typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");

interface HomePageProps {
  onNewBoard?: () => void;
  onOpenFile?: () => void;
  onSettings?: () => void;
  onOpenRecent?: (path: string) => void;
}

export function HomePage({ onNewBoard, onOpenFile, onSettings, onOpenRecent }: HomePageProps) {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  const refresh = useCallback(() => {
    setRecentFiles(getRecentFiles());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleOpen = (path: string) => {
    onOpenRecent?.(path);
  };

  const handleShowInFinder = async (path: string) => {
    try {
      await revealItemInDir(path);
    } catch {
      // fallback: open parent directory
      const parent = path.split(/[\\/]/).slice(0, -1).join("/");
      await openPath(parent);
    }
  };

  const handleRemoveFromRecent = (path: string) => {
    removeRecentFile(path);
    refresh();
  };

  const handleDeleteFile = async (path: string) => {
    try {
      await remove(path);
      removeRecentFile(path);
      refresh();
    } catch {
      // file might already be deleted
      removeRecentFile(path);
      refresh();
    }
  };

  return (
    <div className="h-full w-full flex">
      {/* 侧边栏 */}
      <aside className="w-56 h-full border-r border-border bg-background flex flex-col shrink-0 select-none">
        <div className="px-4 pt-5 pb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
            <span className="text-background text-sm font-bold">CC</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">CherryCanvas</span>
            <span className="text-xs text-muted-foreground leading-tight">树莓白板</span>
          </div>
        </div>

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
      <div className="flex-1 h-full overflow-auto p-8">
        <h2 className="text-lg font-semibold mb-4">最近使用的白板</h2>

        {recentFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无最近打开的白板</p>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-0 py-2.5 font-medium text-muted-foreground">文件名</th>
                  <th className="text-left px-0 py-2.5 font-medium text-muted-foreground">上次修改日期</th>
                  <th className="text-left px-0 py-2.5 font-medium text-muted-foreground">文件大小</th>
                </tr>
              </thead>
              <tbody>
                {recentFiles.map((file) => (
                  <ContextMenu key={file.path}>
                    <ContextMenuTrigger
                      render={<tr className="border-b border-border last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors" />}
                      onClick={() => handleOpen(file.path)}
                    >
                      <td className="px-0 py-2.5">{file.name}</td>
                      <td className="px-0 py-2.5 text-muted-foreground">{formatDate(file.lastModified)}</td>
                      <td className="px-0 py-2.5 text-muted-foreground">{formatFileSize(file.size)}</td>
                    </ContextMenuTrigger>
                    <ContextMenuContent side="bottom" align="start" sideOffset={4}>
                      <ContextMenuItem onClick={() => handleOpen(file.path)}>
                        打开
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => handleShowInFinder(file.path)}>
                        在{isMac ? "访达" : "文件管理器"}中显示
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleRemoveFromRecent(file.path)}>
                        从最近文件中删除
                      </ContextMenuItem>
                      <ContextMenuItem
                        variant="destructive"
                        onClick={() => handleDeleteFile(file.path)}
                      >
                        彻底删除这个文件
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
