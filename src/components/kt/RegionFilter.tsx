/**
 * FILTRO DE REGIÃO EM CROMOSSOMO (RegionFilter.tsx)
 *
 * "All" é o braço curto; as seis regiões dividem o braço longo, alternando
 * papel e lavado como as faixas de um G-banding. O segmento escolhido vira
 * tinta. Cada região leva o ponto da sua cor.
 */

import { CONTINENT_ORDER, type Continent } from "@/constants/regions";
import { RegionDot } from "./Misc";
import { cn } from "@/lib/utils";

interface RegionFilterProps {
  value: Continent | null;
  onChange: (value: Continent | null) => void;
  allLabel?: string;
  /** Rótulos curtos ("M. East") para caber em colunas estreitas. */
  short?: boolean;
  size?: "md" | "sm";
  className?: string;
  label?: string;
}

export const RegionFilter = ({
  value,
  onChange,
  allLabel = "All",
  short = false,
  size = "md",
  className,
  label = "Filter by region",
}: RegionFilterProps) => {
  const height = size === "md" ? 42 : 40;
  const text = size === "md" ? "text-[16px]" : "text-[15px]";

  return (
    <div role="group" aria-label={label} className={cn("flex min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={cn(
          "shrink-0 rounded-full border-[1.5px] border-kt-ink px-[18px] font-[inherit] transition-colors",
          text,
          value === null ? "bg-kt-ink text-kt-paper" : "bg-white text-kt-slate hover:bg-kt-seg"
        )}
        style={{ minHeight: height }}
      >
        {allLabel}
      </button>
      <div className="flex shrink-0 overflow-hidden rounded-full border-[1.5px] border-kt-ink bg-white">
        {CONTINENT_ORDER.map((continent, index) => {
          const active = value === continent;
          const previousActive = index > 0 && value === CONTINENT_ORDER[index - 1];
          return (
            <button
              key={continent}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : continent)}
              className={cn(
                "flex items-center gap-[7px] border-0 px-3.5 font-[inherit] transition-colors",
                text,
                index > 0 && !active && !previousActive && "border-l border-kt-rule",
                active
                  ? "bg-kt-ink text-kt-paper"
                  : cn(index % 2 ? "bg-kt-wash" : "bg-white", "text-kt-slate hover:bg-kt-seg")
              )}
              style={{ minHeight: height - 3 }}
            >
              <RegionDot continent={continent} size={7} ring={active} />
              {short && continent === "Middle East" ? "M. East" : continent}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Abas sublinhadas — ordenação. */
export const SortTabs = <T extends string>({
  options,
  value,
  onChange,
  label = "Sort",
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) => (
  <div role="group" aria-label={label} className="flex gap-5">
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-[42px] border-0 border-b-[1.5px] bg-transparent px-px font-[inherit] text-[16px] transition-colors",
            active ? "border-kt-ink text-kt-ink" : "border-transparent text-kt-body hover:text-kt-ink"
          )}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

/** Segmentos em cápsula (Region / General / Specific, períodos, tipo de perfil). */
export const SegmentedCapsule = <T extends string>({
  options,
  value,
  onChange,
  label,
  dark = false,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  dark?: boolean;
}) => (
  <div
    role="group"
    aria-label={label}
    className={cn(
      "inline-flex max-w-full overflow-hidden rounded-full",
      dark ? "border border-kt-b50/50" : "border-[1.5px] border-kt-ink"
    )}
  >
    {options.map((option, index) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-[40px] border-0 px-[18px] font-[inherit] text-[16px] transition-colors",
            index > 0 && (dark ? "border-l border-kt-b50/35" : "border-l border-kt-rule"),
            dark
              ? active
                ? "bg-kt-wash text-kt-deep"
                : "bg-transparent text-kt-wash hover:bg-white/5"
              : active
                ? "bg-kt-ink text-kt-paper"
                : cn(index % 2 ? "bg-kt-wash" : "bg-white", "text-kt-slate hover:bg-kt-seg")
          )}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
