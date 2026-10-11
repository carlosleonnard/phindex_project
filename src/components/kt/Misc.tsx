/**
 * PEÇAS MENORES DO SISTEMA (Misc.tsx)
 *
 * Moldura de amostra, ponto de região, rótulos em versalete, foto de perfil com
 * substituto e utilitários de texto (tempo relativo, iniciais).
 */

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Continent } from "@/constants/regions";

/** As cores de região de regions.ts, em hex para gradientes. */
export const REGION_HEX: Record<Continent, string> = {
  Africa: "#EE9D2B",
  Americas: "#3FA673",
  Asia: "#DF5549",
  Europe: "#2E8B9E",
  "Middle East": "#8D69BF",
  Oceania: "#428CD7",
};

export const RegionDot = ({
  continent,
  size = 8,
  ring = false,
  className,
}: {
  continent: Continent;
  size?: number;
  ring?: boolean;
  className?: string;
}) => (
  <span
    aria-hidden="true"
    className={cn("inline-block shrink-0 rounded-full", className)}
    style={{
      width: size,
      height: size,
      background: REGION_HEX[continent],
      boxShadow: ring ? "0 0 0 2px #F9FAFB" : undefined,
    }}
  />
);

/** Cantos de registro em volta de uma imagem — a moldura de "amostra". */
export const SpecimenFrame = ({
  children,
  padding = 14,
  tick = 16,
  color = "#287A8A",
  className,
}: {
  children: ReactNode;
  padding?: number;
  tick?: number;
  color?: string;
  className?: string;
}) => {
  const line = `1.5px solid ${color}`;
  const corner = { width: tick, height: tick };
  return (
    <div className={cn("relative", className)} style={{ padding }}>
      <span aria-hidden="true" className="absolute left-0 top-0" style={{ ...corner, borderLeft: line, borderTop: line }} />
      <span aria-hidden="true" className="absolute right-0 top-0" style={{ ...corner, borderRight: line, borderTop: line }} />
      <span aria-hidden="true" className="absolute bottom-0 left-0" style={{ ...corner, borderLeft: line, borderBottom: line }} />
      <span aria-hidden="true" className="absolute bottom-0 right-0" style={{ ...corner, borderRight: line, borderBottom: line }} />
      {children}
    </div>
  );
};

/** Rótulo em versalete. */
export const SC = ({
  children,
  className,
  as: Tag = "span",
}: {
  children: ReactNode;
  className?: string;
  as?: "span" | "p" | "h2" | "h3" | "dt";
}) => <Tag className={cn("font-sc tracking-[0.06em]", className)}>{children}</Tag>;

/** Foto de perfil que preenche o contêiner, com substituto quando falha. */
export const FacePhoto = ({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
  position = "center 28%",
  mirror = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** object-position — retratos têm o rosto no terço de cima. */
  position?: string;
  mirror?: boolean;
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-1.5 text-kt-body",
          "bg-[repeating-linear-gradient(135deg,#F0F4F4_0_9px,#E8EEEF_9px_10px)]",
          className
        )}
        role="img"
        aria-label={alt || "Photo unavailable"}
      >
        <svg width="44" height="50" viewBox="0 0 56 64" fill="none" stroke="#94BCC5" strokeWidth="1.4" aria-hidden="true">
          <ellipse cx="28" cy="25" rx="13" ry="16" />
          <path d="M6 63c2.5-10 11-15 22-15s19.5 5 22 15" />
        </svg>
        <span className="font-sc text-[12px] tracking-[0.08em]">photo</span>
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className, imgClassName)}
      style={{ objectPosition: position, transform: mirror ? "scaleX(-1)" : undefined }}
    />
  );
};

/** Distância em linguagem natural. */
export const timeAgo = (iso: string, compact = false): string => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return compact ? `${minutes}m` : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return compact ? `${hours}h` : `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return compact ? `${days}d` : `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return compact ? `${months}mo` : `${months} months ago`;
  const years = Math.floor(months / 12);
  return compact ? `${years}y` : `${years} ${years === 1 ? "year" : "years"} ago`;
};

/** Duas iniciais para o lugar do avatar. */
export const initialsOf = (name: string | null | undefined): string => {
  const parts = (name || "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toLowerCase();
  return parts.map((part) => part[0]).join("").toLowerCase();
};

/** Avatar circular de iniciais em versalete. */
export const InitialsAvatar = ({
  name,
  size = 38,
  dark = false,
  className,
}: {
  name: string | null | undefined;
  size?: number;
  dark?: boolean;
  className?: string;
}) => (
  <span
    aria-hidden="true"
    className={cn(
      "flex shrink-0 items-center justify-center rounded-full font-sc tracking-[0.03em]",
      dark ? "bg-kt-ink text-kt-paper" : "border border-kt-rule bg-white text-kt-teal",
      className
    )}
    style={{ width: size, height: size, fontSize: Math.round(size * 0.37) }}
  >
    {initialsOf(name)}
  </span>
);

/** "1,284" — números com separador de milhar, como no resto do site. */
export const formatCount = (value: number): string => value.toLocaleString("en-US");
