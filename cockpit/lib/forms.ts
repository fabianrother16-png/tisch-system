import { parseMoney, parseNumber } from "./format";

/** Kleine Helfer zum Auslesen von FormData */

export function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (v == null || typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function reqStr(fd: FormData, key: string): string {
  return str(fd, key) ?? "";
}

export function int(fd: FormData, key: string, fallback = 0): number {
  return Math.round(parseNumber(fd.get(key) as string | null, fallback));
}

export function optInt(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function num(fd: FormData, key: string, fallback = 0): number {
  return parseNumber(fd.get(key) as string | null, fallback);
}

export function money(fd: FormData, key: string): number {
  return parseMoney(fd.get(key));
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

export function list(fd: FormData, key: string): string[] {
  return fd.getAll(key).map(String).filter(Boolean);
}

export function isDate(v: string | null): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
