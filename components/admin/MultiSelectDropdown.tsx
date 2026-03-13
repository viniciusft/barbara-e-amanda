"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: SelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  allLabel?: string;
}

export default function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  allLabel = "Todos",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const displayLabel =
    selected.length === 0
      ? allLabel
      : selected.length === 1
      ? (options.find((o) => o.value === selected[0])?.label ?? selected[0])
      : `${selected.length} selecionados`;

  const isAll = selected.length === 0;

  return (
    <div className="relative" ref={ref}>
      <p className="text-foreground/35 text-[10px] font-sans uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 bg-surface-elevated border text-sm font-sans px-3 py-1.5 min-w-[160px] focus:outline-none transition-colors ${
          open
            ? "border-gold text-foreground/80"
            : "border-surface-border text-foreground/60 hover:border-foreground/20"
        } ${!isAll ? "border-[var(--gold-muted-border)] text-gold" : ""}`}
      >
        <span className="flex-1 text-left truncate">{displayLabel}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-surface-card border border-surface-border min-w-[200px] shadow-2xl">
          <button
            onClick={() => onChange([])}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-sans text-left border-b border-surface-border transition-colors ${
              isAll
                ? "text-gold bg-[var(--gold-muted)]"
                : "text-foreground/45 hover:text-foreground/75 hover:bg-surface-elevated"
            }`}
          >
            <span className="w-[13px] flex items-center">
              {isAll && <Check size={12} strokeWidth={2} />}
            </span>
            {allLabel}
          </button>
          {options.map((opt) => {
            const active = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-sans text-left transition-colors ${
                  active
                    ? "text-gold bg-[var(--gold-muted)]"
                    : "text-foreground/60 hover:text-foreground/80 hover:bg-surface-elevated"
                }`}
              >
                <span className="w-[13px] flex items-center">
                  {active && <Check size={12} strokeWidth={2} />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
