import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { exportSVG, exportPNG, exportCCWI } from "@/lib/save";
import type { StrokeData } from "@/components/TitleBar";

type SaveFormat = "svg" | "png" | "ccwi";

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: StrokeData[][];
  currentPageIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  onSave?: (savedPath: string) => void;
}

export function SaveDialog({
  open,
  onOpenChange,
  pages,
  currentPageIndex,
  canvasWidth,
  canvasHeight,
  onSave,
}: SaveDialogProps) {
  const [format, setFormat] = useState<SaveFormat>("ccwi");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      let savedPath: string | null = null;
      switch (format) {
        case "svg":
          savedPath = await exportSVG(pages[currentPageIndex] ?? [], canvasWidth, canvasHeight);
          break;
        case "png":
          savedPath = await exportPNG(pages[currentPageIndex] ?? [], canvasWidth, canvasHeight);
          break;
        case "ccwi":
          savedPath = await exportCCWI(pages);
          break;
      }
      if (savedPath) {
        toast.success("保存成功");
        onSave?.(savedPath);
      }
    } finally {
      setSaving(false);
      onOpenChange(false);
    }
  };

  const formats: { value: SaveFormat; label: string; desc: string }[] = [
    { value: "ccwi", label: "CCWI 文件", desc: "包含所有页的墨迹数据" },
    { value: "svg", label: "SVG 矢量图", desc: "当前页，可缩放" },
    { value: "png", label: "PNG 图片", desc: "当前页，位图格式" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>另存为</DialogTitle>
          <DialogDescription>选择导出格式</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {formats.map((f) => (
            <button
              key={f.value}
              className={`flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors ${
                format === f.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              }`}
              onClick={() => setFormat(f.value)}
            >
              <span className="text-sm font-medium">{f.label}</span>
              <span className="text-xs text-muted-foreground">{f.desc}</span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
