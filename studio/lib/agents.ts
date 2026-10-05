import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { SegmentSlug } from "./types";

/**
 * Die Playbooks liegen als Claude-Code-Subagenten in .claude/agents/<segment>.md –
 * dieselben Dateien nutzt Claude Code direkt. Hier wird nur der Text nach dem
 * Frontmatter als Fachwissen für das Studio gelesen.
 */
const cache = new Map<string, string>();

async function readCached(key: string, read: () => Promise<string>) {
  if (process.env.NODE_ENV === "production" && cache.has(key)) return cache.get(key)!;
  const text = await read();
  cache.set(key, text);
  return text;
}

export function stripFrontmatter(markdown: string) {
  const match = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return (match ? markdown.slice(match[0].length) : markdown).trim();
}

export async function loadPlaybook(segment: SegmentSlug) {
  const text = await readCached(`agent:${segment}`, () =>
    fs.readFile(path.join(process.cwd(), ".claude", "agents", `${segment}.md`), "utf8"),
  );
  return stripFrontmatter(text);
}

export async function loadGrundregeln() {
  const text = await readCached("grundregeln", () => fs.readFile(path.join(process.cwd(), "prompts", "grundregeln.md"), "utf8"));
  return text.trim();
}
