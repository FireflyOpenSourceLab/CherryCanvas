import { Settings, Palette, Keyboard, Info } from "lucide-react";

export function SettingsPage() {
  return (
    <div className="h-full w-full flex">
      {/* 侧边栏 */}
      <aside className="w-56 h-full border-r border-border bg-background flex flex-col shrink-0 select-none">
        <div className="px-4 pt-5 pb-4">
          <h2 className="text-sm font-semibold">设置</h2>
        </div>

        <nav className="px-3 flex flex-col gap-0.5">
          <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[5px] text-sm bg-muted text-foreground">
            <Settings className="size-4 shrink-0" />
            <span>通用</span>
          </button>
          <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[5px] text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Palette className="size-4 shrink-0" />
            <span>外观</span>
          </button>
          <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[5px] text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Keyboard className="size-4 shrink-0" />
            <span>快捷键</span>
          </button>
          <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[5px] text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Info className="size-4 shrink-0" />
            <span>关于</span>
          </button>
        </nav>
      </aside>

      {/* 设置内容区 */}
      <div className="flex-1 h-full p-6 overflow-y-auto">
        <h1 className="text-lg font-semibold mb-4">通用设置</h1>
        <p className="text-sm text-muted-foreground">设置内容待实现。</p>
      </div>
    </div>
  );
}
