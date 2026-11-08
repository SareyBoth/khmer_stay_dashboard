"use client";

import * as React from "react";
import { cn } from "cn";
import { ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type MultiSelectOption = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options…",
  className,
  disabled = false,
}: MultiSelectProps) {
  const toggleOption = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((item) => item !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const removeOption = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== val));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-transparent px-3 py-1.5 text-left text-sm font-normal transition hover:bg-accent/40",
            selected.length === 0 && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
            {selected.length === 0 && <span>{placeholder}</span>}
            {selected.length > 0 && selected.length <= 2 && (
              selected.map((val) => {
                const opt = options.find((o) => o.value === val);
                return (
                  <Badge
                    key={val}
                    variant="secondary"
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                  >
                    <span>{opt?.label || val}</span>
                    <button
                      type="button"
                      onClick={(e) => removeOption(val, e)}
                      className="rounded-full p-0.5 hover:bg-black/10 focus:outline-none"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                );
              })
            )}
            {selected.length > 2 && (
              <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-xs font-semibold">
                {selected.length} selected
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto p-1"
      >
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={() => toggleOption(option.value)}
            className="cursor-pointer py-1.5 text-sm"
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
