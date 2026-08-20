import { useState, useCallback, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { open, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { TitleBar, ActiveView, Tab, StrokeData } from "./components/TitleBar";
import { HomePage } from "./components/HomePage";
import { SettingsPage } from "./components/SettingsPage";
import { Whiteboard } from "./components/Whiteboard";
import { PaginationBar } from "./components/PaginationBar";
import { SaveDialog } from "./components/SaveDialog";
import { RenameDialog } from "./components/RenameDialog";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { addRecentFile } from "./lib/recent";

let nextId = 1;

function App() {
  const [activeView, setActiveView] = useState<ActiveView>({ type: "home" });
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTabId, setSaveTabId] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingTab, setRenamingTab] = useState<{ id: string; title: string } | null>(null);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [unsavedTabs, setUnsavedTabs] = useState<Tab[]>([]);
  const forceCloseRef = useRef(false);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (activeView.type === "tab") {
          setSaveTabId(activeView.id);
          setSaveDialogOpen(true);
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (activeView.type === "tab") {
          const tab = tabs.find((t) => t.id === activeView.id);
          if (tab?.savedPath) {
            handleAutoSave(tab);
          } else {
            setSaveTabId(activeView.id);
            setSaveDialogOpen(true);
          }
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "w") {
        e.preventDefault();
        triggerCloseCheck();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeView, tabs]);

  // macOS native menu events
  useEffect(() => {
    const unlisten = listen<string>("menu-event", (event) => {
      switch (event.payload) {
        case "save":
          if (activeView.type === "tab") {
            const tab = tabs.find((t) => t.id === activeView.id);
            if (tab?.savedPath) {
              handleAutoSave(tab);
            } else {
              setSaveTabId(activeView.id);
              setSaveDialogOpen(true);
            }
          }
          break;
        case "save_as":
          if (activeView.type === "tab") {
            setSaveTabId(activeView.id);
            setSaveDialogOpen(true);
          }
          break;
        case "close_tab":
          triggerCloseCheck();
          break;
        case "new_board":
          addTab();
          break;
        case "open":
          handleOpenFile();
          break;
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [activeView, tabs]);

  const triggerCloseCheck = useCallback(() => {
    if (forceCloseRef.current) {
      getCurrentWindow().destroy();
      return;
    }
    const unsaved = tabsRef.current.filter((t) => !t.savedPath);
    if (unsaved.length === 0) {
      forceCloseRef.current = true;
      getCurrentWindow().destroy();
      return;
    }
    setUnsavedTabs(unsaved);
    setUnsavedDialogOpen(true);
  }, []);

  // Intercept window close (native close button)
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    getCurrentWindow().onCloseRequested(async (event) => {
      event.preventDefault();
      triggerCloseCheck();
    }).then((fn) => { unlistenFn = fn; });

    return () => { unlistenFn?.(); };
  }, [triggerCloseCheck]);

  const addTab = useCallback(() => {
    const id = String(nextId++);
    const title = `白板 ${nextId - 1}`;
    const tab: Tab = { id, title, pages: [[]], currentPage: 0 };
    setTabs((prev) => [...prev, tab]);
    setActiveView({ type: "tab", id, title });
  }, []);

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (activeView.type === "tab" && activeView.id === id) {
          if (next.length > 0) {
            const last = next[next.length - 1];
            setActiveView({ type: "tab", id: last.id, title: last.title });
          } else {
            setActiveView({ type: "home" });
          }
        }
        return next;
      });
    },
    [activeView],
  );

  const renameTab = useCallback((id: string, newTitle: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t)),
    );
    setActiveView((prev) =>
      prev.type === "tab" && prev.id === id
        ? { ...prev, title: newTitle }
        : prev,
    );
  }, []);

  const exportTab = useCallback((id: string) => {
    setSaveTabId(id);
    setSaveDialogOpen(true);
  }, []);

  const updateTabStrokes = useCallback(
    (tabId: string, pageIdx: number, strokes: StrokeData[]) => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== tabId) return t;
          const pages = [...t.pages];
          pages[pageIdx] = strokes;
          return { ...t, pages };
        }),
      );
    },
    [],
  );

  const changePage = useCallback(
    (tabId: string, pageIdx: number) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, currentPage: pageIdx } : t)),
      );
    },
    [],
  );

  const addPage = useCallback(
    (tabId: string) => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== tabId) return t;
          return {
            ...t,
            pages: [...t.pages, []],
            currentPage: t.pages.length,
          };
        }),
      );
    },
    [],
  );

  const handleSettings = useCallback(() => {
    setActiveView({ type: "settings" });
  }, []);

  const handleOpenFile = useCallback(async () => {
    const path = await open({
      multiple: false,
      filters: [{ name: "CherryCanvas", extensions: ["ccwi"] }],
    });
    if (!path) return;
    await openFileByPath(path as string);
  }, []);

  const handleOpenRecent = useCallback(async (path: string) => {
    await openFileByPath(path);
  }, []);

  const openFileByPath = useCallback(async (path: string) => {
    try {
      const data = await readFile(path);
      const text = new TextDecoder().decode(data);
      const file = JSON.parse(text) as { version: number; pages: StrokeData[][] };
      if (!file.pages || !Array.isArray(file.pages)) return;
      const id = String(nextId++);
      const title = path.split(/[\\/]/).pop()?.replace(/\.ccwi$/, "") ?? `白板 ${nextId - 1}`;
      const tab: Tab = { id, title, pages: file.pages, currentPage: 0, savedPath: path };
      setTabs((prev) => [...prev, tab]);
      setActiveView({ type: "tab", id, title });
      addRecentFile(path);
    } catch {
      toast.error("无法打开文件，文件可能已被移动或删除");
    }
  }, []);

  const activeTab =
    activeView.type === "tab"
      ? tabs.find((t) => t.id === activeView.id)
      : undefined;

  const saveTab = saveTabId ? tabs.find((t) => t.id === saveTabId) : activeTab;

  const handleAutoSave = useCallback(
    async (tab: Tab) => {
      try {
        const { saveToPath } = await import("./lib/save");
        await saveToPath(tab.savedPath!, tab.pages);
        addRecentFile(tab.savedPath!);
        toast.success("已保存");
      } catch (e) {
        toast.error(`保存失败: ${e}`);
      }
    },
    [],
  );

  const handleSaveDialogSave = useCallback((savedPath: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === saveTabId ? { ...t, savedPath } : t,
      ),
    );
    addRecentFile(savedPath);
    setSaveTabId(null);
  }, [saveTabId]);

  const handleDiscardAll = useCallback(async () => {
    setUnsavedDialogOpen(false);
    forceCloseRef.current = true;
    await getCurrentWindow().destroy();
  }, []);

  const handleSaveAll = useCallback(async () => {
    const { saveToPath } = await import("./lib/save");
    let allSaved = true;
    for (const tab of unsavedTabs) {
      if (tab.savedPath) {
        try {
          await saveToPath(tab.savedPath, tab.pages);
          addRecentFile(tab.savedPath);
        } catch {
          allSaved = false;
        }
      } else {
        const path = await saveDialog({
          defaultPath: `${tab.title}.ccwi`,
          filters: [{ name: "CherryCanvas", extensions: ["ccwi"] }],
        });
        if (path) {
          try {
            await saveToPath(path, tab.pages);
            addRecentFile(path);
            setTabs((prev) =>
              prev.map((t) => (t.id === tab.id ? { ...t, savedPath: path } : t)),
            );
          } catch {
            allSaved = false;
          }
        } else {
          allSaved = false;
        }
      }
    }
    setUnsavedDialogOpen(false);
    if (allSaved) {
      forceCloseRef.current = true;
      await getCurrentWindow().destroy();
    } else {
      toast.error("部分文件保存失败，窗口未关闭");
    }
  }, [unsavedTabs]);

  return (
    <main className="h-screen w-screen pt-10">
      <TitleBar
        activeView={activeView}
        tabs={tabs}
        onViewChange={setActiveView}
        onAddTab={addTab}
        onCloseTab={closeTab}
        onRenameTab={(id, title) => {
          setRenamingTab({ id, title });
          setRenameDialogOpen(true);
        }}
        onExportTab={exportTab}
      />
      {activeView.type === "home" && (
        <HomePage
          onNewBoard={addTab}
          onSettings={handleSettings}
          onOpenFile={handleOpenFile}
          onOpenRecent={handleOpenRecent}
        />
      )}
      {activeView.type === "settings" && <SettingsPage />}
      {activeView.type === "tab" && activeTab && (
        <>
          <Whiteboard
            tabId={activeView.id}
            pageIndex={activeTab.currentPage}
            strokes={activeTab.pages[activeTab.currentPage] || []}
            onStrokesChange={(strokes) =>
              updateTabStrokes(activeView.id, activeTab.currentPage, strokes)
            }
          />
          <PaginationBar
            current={activeTab.currentPage + 1}
            total={activeTab.pages.length}
            onPrev={() => changePage(activeView.id, activeTab.currentPage - 1)}
            onNext={() => changePage(activeView.id, activeTab.currentPage + 1)}
            onAdd={() => addPage(activeView.id)}
          />
        </>
      )}
      {saveTab && (
        <SaveDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          pages={saveTab.pages}
          currentPageIndex={saveTab.currentPage}
          canvasWidth={window.innerWidth}
          canvasHeight={window.innerHeight - 40}
          onSave={handleSaveDialogSave}
        />
      )}
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        initialName={renamingTab?.title ?? ""}
        onRename={(name) => {
          if (renamingTab) {
            renameTab(renamingTab.id, name);
          }
        }}
      />
      <Toaster position="top-center" offset={48} />

      {/* Unsaved files dialog */}
      {unsavedDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-lg shadow-lg w-96 overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-base font-semibold">有未保存的文件</h3>
              <p className="text-sm text-muted-foreground mt-1">以下文件尚未保存：</p>
              <ul className="mt-3 max-h-48 overflow-auto space-y-1">
                {unsavedTabs.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded bg-muted/50">
                    <span className="truncate">{t.title}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30">
              <button
                onClick={() => setUnsavedDialogOpen(false)}
                className="px-4 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDiscardAll}
                className="px-4 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
              >
                全部丢弃
              </button>
              <button
                onClick={handleSaveAll}
                className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                全部保存
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
