"use client";

import { Minus, Plus } from "iconoir-react";

import { Button } from "@/components/ui/button";
import { StepperProps } from "@/types";
import { cn } from "@/lib/utils";

export function Stepper({ value, onChange, min = 1, max }: StepperProps) {
  const isMin = value <= min;
  const isMax = max !== undefined && value >= max;

  return (
    <div className="flex gap-2 items-center w-full sm:w-auto">
      <Button
        type="button"
        className={cn(
          "w-12 h-12 p-0 rounded-full cursor-pointer border border-neutral-200 text-neutral-600 bg-white hover:border-violet-600 hover:text-violet-600 hover:bg-violet-200",
          isMin && "opacity-50 cursor-not-allowed",
        )}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={isMin}
      >
        <Minus className="w-6 h-6" />
      </Button>
      <div className="w-full sm:w-[64px] text-center select-none">{value}</div>
      <Button
        type="button"
        className={cn(
          "w-12 h-12 p-0 rounded-full cursor-pointer border border-neutral-200 text-neutral-600 bg-white hover:border-violet-600 hover:text-violet-600 hover:bg-violet-200",
          isMax && "opacity-50 cursor-not-allowed",
        )}
        onClick={() => onChange(value + 1)}
        disabled={isMax}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
