import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface PenSettings {
  color: string;
  size: number;
  opacity: number;
  penType: "normal" | "highlighter" | "pencil";
}

interface PenMenuProps {
  settings: PenSettings;
  onChange: (settings: PenSettings) => void;
}

const COLORS = [
  "#000000",
  "#FFFFFF",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#78716C",
];

export function PenMenu({ settings, onChange }: PenMenuProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* 调色盘 */}
      <div className="flex flex-col gap-3">
        <span className="text-sm text-muted-foreground">颜色</span>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c}
              className={cn(
                "size-8 rounded-full border-2 transition-all hover:scale-110",
                c === "#FFFFFF" ? "border-border" : "border-transparent",
                settings.color === c && "ring-2 ring-ring ring-offset-2 ring-offset-background"
              )}
              style={{ backgroundColor: c }}
              onClick={() => onChange({ ...settings, color: c })}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* 笔的粗细 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">粗细</span>
          <span className="text-sm text-muted-foreground tabular-nums">{settings.size}</span>
        </div>
        <Slider
          value={[settings.size]}
          min={1}
          max={20}
          onValueChange={(v) => onChange({ ...settings, size: Array.isArray(v) ? v[0] : v })}
        />
      </div>

      {/* 笔的透明度 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">透明度</span>
          <span className="text-sm text-muted-foreground tabular-nums">{settings.opacity}%</span>
        </div>
        <Slider
          value={[settings.opacity]}
          min={10}
          max={100}
          onValueChange={(v) => onChange({ ...settings, opacity: Array.isArray(v) ? v[0] : v })}
        />
      </div>

      {/* 笔的种类 */}
      <div className="flex flex-col gap-3">
        <span className="text-sm text-muted-foreground">笔种</span>
        <Select
          value={settings.penType}
          onValueChange={(v) =>
            onChange({ ...settings, penType: v as PenSettings["penType"] })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">普通笔</SelectItem>
            <SelectItem value="highlighter">荧光笔</SelectItem>
            <SelectItem value="pencil">铅笔</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
