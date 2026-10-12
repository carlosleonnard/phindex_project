/**
 * CAMPOS DE FORMULÁRIO (Form.tsx)
 *
 * As peças dos formulários no desenho do site, no lugar dos <select> nativos:
 *
 *   FieldLabel   — rótulo em versalete; marca o campo obrigatório e, depois de
 *                  uma tentativa de envio, o que ainda falta.
 *   ChoiceChips  — escolha única entre poucas opções, em cápsulas (gênero,
 *                  categoria, área). Funciona como um grupo de rádio: setas
 *                  movem a escolha, Tab entra e sai do grupo.
 *   SearchSelect — busca com lista para escolhas longas (país, ancestralidade),
 *                  simples ou múltipla. A lista abre no fluxo do formulário, e
 *                  não flutuando: dentro de um modal com rolagem, um painel
 *                  absoluto seria cortado pela borda.
 *   PhotoSlot    — a vaga de foto tracejada, com arrastar e soltar.
 */

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Plus, Search, X } from "lucide-react";
import { chipClass } from "@/components/kt/Listing";
import { cn } from "@/lib/utils";

/** Texto de erro: o vermelho do site seria baixo demais em contraste com o papel. */
export const ERROR_TEXT = "text-[#A3261B]";

export const FieldLabel = ({
  htmlFor,
  id,
  children,
  required,
  optional,
  invalid,
  hint,
}: {
  htmlFor?: string;
  id?: string;
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
  /** Depois de tentar enviar, o campo ainda está vazio. */
  invalid?: boolean;
  hint?: ReactNode;
}) => {
  const Tag = htmlFor ? "label" : "span";
  return (
    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <Tag htmlFor={htmlFor} id={id} className="font-sc text-[15px] font-semibold tracking-[0.06em] text-kt-slate">
        {children}
        {required && (
          <span aria-hidden="true" className="ml-1 text-kt-teal">
            *
          </span>
        )}
        {optional && <span className="ml-1.5 font-serif text-[14px] font-normal italic tracking-normal text-kt-body">optional</span>}
      </Tag>
      {invalid ? (
        <span className={cn("text-[14px] italic", ERROR_TEXT)}>needed</span>
      ) : (
        hint && <span className="text-[14px] italic text-kt-body">{hint}</span>
      )}
    </div>
  );
};

export interface Choice<T extends string> {
  value: T;
  label: string;
}

export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
  allowDeselect = false,
  invalid = false,
  className,
}: {
  options: Choice<T>[];
  value: T | "";
  onChange: (value: T | "") => void;
  labelledBy: string;
  /** Tocar na opção escolhida a desmarca (campos opcionais). */
  allowDeselect?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex((option) => option.value === value);
  // Sem escolha, a primeira opção recebe o Tab; com escolha, a escolhida.
  const tabStop = selectedIndex === -1 ? 0 : selectedIndex;

  const move = (event: KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    refs.current[next]?.focus();
    onChange(options[next].value);
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-invalid={invalid || undefined}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={index === tabStop ? 0 : -1}
            onClick={() => onChange(active && allowDeselect ? "" : option.value)}
            onKeyDown={(event) => move(event, index)}
            className={chipClass(active, cn("text-[16px]", invalid && !active && "border-[#A3261B]/50"))}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Compara sem caixa e sem acento: "sao tome" acha "São Tomé and Príncipe". */
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

type SearchSelectProps = {
  id: string;
  options: string[];
  placeholder?: string;
  labelledBy?: string;
  invalid?: boolean;
  className?: string;
} & (
  | { multiple?: false; value: string; onChange: (value: string) => void; max?: never }
  | { multiple: true; value: string[]; onChange: (value: string[]) => void; max?: number }
);

export const SearchSelect = (props: SearchSelectProps) => {
  const { id, options, placeholder = "Search…", labelledBy, invalid, className } = props;
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Por dentro, as duas formas viram uma lista; `emit` devolve no formato de cada uma.
  const multiple = props.multiple === true;
  const max = multiple ? props.max : undefined;
  const singleValue = multiple ? "" : (props.value as string);
  const chosen: string[] = multiple ? (props.value as string[]) : singleValue ? [singleValue] : [];
  const full = multiple && max !== undefined && chosen.length >= max;
  const emit = (next: string[]) => {
    if (multiple) (props.onChange as (value: string[]) => void)(next);
    else (props.onChange as (value: string) => void)(next[0] ?? "");
  };

  const matches = useMemo(() => {
    const needle = fold(query.trim());
    const pool = multiple ? options.filter((option) => !chosen.includes(option)) : options;
    if (!needle) return pool;
    const starts: string[] = [];
    const contains: string[] = [];
    for (const option of pool) {
      const folded = fold(option);
      if (folded.startsWith(needle)) starts.push(option);
      else if (folded.includes(needle)) contains.push(option);
    }
    return [...starts, ...contains];
    // chosen muda de identidade a cada render quando é array; a lista depende do conteúdo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, options, chosen.join("|"), multiple]);

  // Navegando pelo teclado, a opção ativa não pode sair da área visível da lista.
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, listId]);

  const pick = (option: string) => {
    if (multiple) {
      if (!chosen.includes(option) && !full) emit([...chosen, option]);
      setQuery("");
      setActive(0);
      inputRef.current?.focus();
    } else {
      emit([option]);
      setQuery("");
      setOpen(false);
    }
  };

  const remove = (option: string) => {
    emit(chosen.filter((item) => item !== option));
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      if (open && matches[active]) {
        event.preventDefault();
        pick(matches[active]);
      }
    } else if (event.key === "Escape") {
      if (open) {
        // Fecha a lista sem fechar o modal em volta.
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    } else if (event.key === "Backspace" && !query && multiple && chosen.length > 0) {
      remove(chosen[chosen.length - 1]);
    }
  };

  // Escolha única: fora da edição, o campo mostra o valor escolhido.
  const showingValue = !multiple && !open && !query && Boolean(singleValue);
  const listOpen = open && !full;

  return (
    <div className={className}>
      {multiple && chosen.length > 0 && (
        <ul className="m-0 mb-2.5 flex list-none flex-wrap gap-2 p-0" aria-label="Chosen">
          {chosen.map((option) => (
            <li key={option}>
              <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border-[1.5px] border-kt-ink bg-kt-ink pl-3.5 pr-1.5 text-[15px] text-kt-paper">
                {option}
                <button
                  type="button"
                  onClick={() => remove(option)}
                  aria-label={`Remove ${option}`}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border-0 bg-transparent text-kt-paper hover:bg-white/15"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-kt-body"
          strokeWidth={1.7}
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={listOpen && matches[active] ? `${listId}-${active}` : undefined}
          aria-labelledby={labelledBy}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          disabled={full}
          value={showingValue ? singleValue : query}
          placeholder={
            full
              ? `${max} chosen — remove one to change`
              : !multiple && singleValue
                ? singleValue
                : placeholder
          }
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={cn(
            "box-border h-12 w-full rounded-full border bg-white pl-11 pr-11 font-[inherit] text-[17px] text-kt-ink placeholder:text-kt-mute",
            "focus-visible:border-kt-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kt-teal/30",
            "disabled:cursor-not-allowed disabled:bg-kt-wash",
            invalid ? "border-[#A3261B]/60" : "border-kt-rule hover:border-kt-b50"
          )}
        />
        {!multiple && singleValue && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => remove(singleValue)}
            aria-label={`Clear ${singleValue}`}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-kt-wash text-kt-ink hover:bg-kt-seg"
          >
            <X className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          </button>
        )}
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-labelledby={labelledBy}
        hidden={!listOpen}
        className="m-0 mt-2 max-h-[232px] list-none overflow-y-auto rounded-[3px] border border-kt-rule bg-white p-1.5"
      >
        {/* Fechada, a lista não desenha nada: a de ancestralidade tem mais de 400 opções. */}
        {!listOpen ? null : matches.length === 0 ? (
          <li className="px-3 py-2.5 text-[15px] italic text-kt-body">Nothing matches “{query.trim()}”.</li>
        ) : (
          matches.map((option, index) => {
            const selected = chosen.includes(option);
            return (
              <li
                key={option}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={selected}
                // mousedown, não click: o clique viria depois do blur que fecha a lista.
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(option);
                }}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  "flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-full px-3.5 text-[16px]",
                  index === active ? "bg-kt-wash text-kt-ink" : "text-kt-slate",
                  selected && "font-semibold text-kt-ink"
                )}
              >
                {option}
                {selected && <span className="font-sc text-[13px] tracking-[0.06em] text-kt-teal">chosen</span>}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export const PhotoSlot = ({
  id,
  label,
  required = false,
  url,
  uploading = false,
  invalid = false,
  onFile,
  onClear,
}: {
  id: string;
  label: string;
  required?: boolean;
  url?: string;
  uploading?: boolean;
  invalid?: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}) => {
  const [over, setOver] = useState(false);

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={cn(
        "relative aspect-[4/5] overflow-hidden rounded-[3px] border-[1.5px] border-dashed transition-colors focus-within:ring-2 focus-within:ring-kt-teal/40",
        over ? "border-kt-teal bg-kt-wash" : invalid ? "border-[#A3261B]/60 bg-kt-paper" : "border-kt-b50 bg-kt-paper"
      )}
    >
      {url ? (
        <>
          <img src={url} alt={`${label}, uploaded`} className="absolute inset-0 h-full w-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove the ${label}`}
            className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border-0 bg-kt-ink text-kt-paper shadow-sm hover:bg-kt-teal"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </button>
          <span className="absolute bottom-2 left-2 rounded-full bg-kt-ink/85 px-2.5 pb-1 pt-[3px] font-sc text-[13px] leading-[1.3] tracking-[0.05em] text-kt-paper">
            {label}
          </span>
        </>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 px-3 text-center",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          <Plus className="h-6 w-6 text-kt-teal" strokeWidth={1.6} aria-hidden="true" />
          <span className="font-sc text-[16px] tracking-[0.05em] text-kt-teal">{uploading ? "uploading…" : label}</span>
          <span className="text-[13px] italic text-kt-body">{required ? "required · tap or drop" : "optional · tap or drop"}</span>
        </label>
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          // Permite escolher o mesmo arquivo de novo depois de remover.
          event.target.value = "";
        }}
      />
    </div>
  );
};
