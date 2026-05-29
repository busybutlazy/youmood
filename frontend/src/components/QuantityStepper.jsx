import { Minus, Plus } from "lucide-react";

// 數量選擇器（- / +，最小 1）
export default function QuantityStepper({ value, onChange, min = 1 }) {
  return (
    <div className="inline-flex items-center rounded-md border border-border">
      <button
        type="button"
        aria-label="減少數量"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-11 w-11 items-center justify-center text-wood transition-colors hover:bg-muted disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-12 text-center text-base font-medium tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="增加數量"
        onClick={() => onChange(value + 1)}
        className="flex h-11 w-11 items-center justify-center text-wood transition-colors hover:bg-muted"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
