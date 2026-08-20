import { useState, useCallback } from "react";
import { TitleBar, ActiveView, Tab, StrokeData } from "./components/TitleBar";
import { HomePage } from "./components/HomePage";
import { SettingsPage } from "./components/SettingsPage";
import { Whiteboard } from "./components/Whiteboard";
import { PaginationBar } from "./components/PaginationBar";

let nextId = 1;

function App() {
  const [activeView, setActiveView] = useState<ActiveView>({ type: "home" });
  const [tabs, setTabs] = useState<Tab[]>([]);

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

  const activeTab =
    activeView.type === "tab"
      ? tabs.find((t) => t.id === activeView.id)
      : undefined;

  return (
    <main className="h-screen w-screen pt-10">
      <TitleBar
        activeView={activeView}
        tabs={tabs}
        onViewChange={setActiveView}
        onAddTab={addTab}
        onCloseTab={closeTab}
      />
      {activeView.type === "home" && (
        <HomePage onNewBoard={addTab} onSettings={handleSettings} />
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
    </main>
  );
}

export default App;
