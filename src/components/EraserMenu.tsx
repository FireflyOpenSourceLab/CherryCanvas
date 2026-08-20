import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export interface EraserSettings {
  size: number;
}

interface EraserMenuProps {
  settings: EraserSettings;
  onChange: (settings: EraserSettings) => void;
  onClearPage: () => void;
}

export function EraserMenu({ settings, onChange, onClearPage }: EraserMenuProps) {
  return (
    <div className="flex flex-col gap-6 w-full p-2">
      {/* 橡皮擦大小 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">大小</span>
          <span className="text-sm text-muted-foreground tabular-nums">{settings.size}</span>
        </div>
        <Slider
          value={[settings.size]}
          min={5}
          max={80}
          onValueChange={(v) => onChange({ size: Array.isArray(v) ? v[0] : v })}
        />
      </div>

      <Separator />

      {/* 一键清页 */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={onClearPage}
      >
        清除当前页
      </Button>
    </div>
  );
}
