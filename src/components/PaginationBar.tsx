import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationBarProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onAdd: () => void;
}

export function PaginationBar({
  current,
  total,
  onPrev,
  onNext,
  onAdd,
}: PaginationBarProps) {
  const pagination = (
    <div className="flex items-center gap-0.5 bg-background/80 backdrop-blur-sm border border-border rounded-[10px] px-1.5 py-1 shadow-sm select-none">
      <Button
        variant="ghost"
        size="icon"
        disabled={current <= 1}
        className="size-9 rounded-[6px]"
        onClick={onPrev}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <span className="px-1.5 text-sm text-muted-foreground tabular-nums">
        {current}/{total}
      </span>
      <Button
        variant="ghost"
        size="icon"
        disabled={current >= total}
        className="size-9 rounded-[6px]"
        onClick={onNext}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );

  const addBtn = (
    <div className="flex items-center bg-background/80 backdrop-blur-sm border border-border rounded-[10px] px-1.5 py-1 shadow-sm select-none">
      <Button
        variant="ghost"
        size="icon"
        className="size-9 rounded-[6px]"
        onClick={onAdd}
      >
        <Plus className="size-5" />
      </Button>
    </div>
  );

  return (
    <>
      {/* 左下角：翻页器 + 新建页 */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
        {pagination}
        {addBtn}
      </div>

      {/* 右下角：翻页器 + 新建页 */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        {pagination}
        {addBtn}
      </div>
    </>
  );
}
