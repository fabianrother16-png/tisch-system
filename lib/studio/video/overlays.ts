// Zeichnet Untertitel (4 Stile), Hook- und Info-Overlays, Wasserzeichen und
// Fortschrittsbalken auf das Canvas. Positionen halten die Safe-Zones von
// TikTok/Reels ein (oben Suchleiste, rechts Buttons, unten Caption).

import type { CaptionStyleId, TranscriptWord } from "../types";
import type { TextOverlay, Timeline } from "./timeline";

export type CaptionPage = { words: TranscriptWord[]; start: number; end: number };

const MAX_CHARS: Record<CaptionStyleId, number> = { bold: 16, karaoke: 34, clean: 40, box: 22 };
const MAX_WORDS: Record<CaptionStyleId, number> = { bold: 3, karaoke: 7, clean: 8, box: 4 };

/** Teilt Wörter in Untertitel-"Seiten", die jeweils gemeinsam erscheinen. */
export function paginateCaptions(words: TranscriptWord[], style: CaptionStyleId): CaptionPage[] {
  const pages: CaptionPage[] = [];
  let current: TranscriptWord[] = [];
  const flush = () => {
    if (!current.length) return;
    pages.push({ words: current, start: current[0].start, end: current[current.length - 1].end });
    current = [];
  };
  for (const word of words) {
    const prev = current[current.length - 1];
    const chars = current.reduce((n, w) => n + w.text.length + 1, 0) + word.text.length;
    if (prev && (word.start - prev.end > 0.45 || current.length >= MAX_WORDS[style] || chars > MAX_CHARS[style])) flush();
    current.push(word);
    if (/[.!?…]$/.test(word.text)) flush();
  }
  flush();
  // Seite bis kurz vor die nächste stehen lassen (kein Flackern zwischen Wörtern).
  for (let i = 0; i < pages.length; i++) {
    const next = pages[i + 1];
    pages[i].end = next ? Math.min(next.start, pages[i].end + 0.6) : pages[i].end + 0.5;
  }
  return pages;
}

function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function highlightColor(primary: string) {
  // Zu dunkle Markenfarben sind auf Video schlecht lesbar → Signalgelb.
  return luminance(primary) < 0.28 ? "#FFE14D" : primary;
}

function readableOn(bg: string) {
  return luminance(bg) > 0.45 ? "#111111" : "#FFFFFF";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const easeOutBack = (x: number) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;

export function drawCaptions(
  ctx: CanvasRenderingContext2D,
  pages: CaptionPage[],
  t: number,
  tl: Timeline,
  font: string,
) {
  const page = pages.find((p) => t >= p.start && t < p.end);
  if (!page) return;
  const W = tl.width;
  const H = tl.height;
  const style = tl.captionStyle;
  const hl = highlightColor(tl.brand.primary);
  const centerX = W / 2 - 20;
  const baseY = H * 0.66;
  const maxWidth = W - 240;
  const active = page.words.findIndex((w) => t >= w.start && t < w.end + 0.05);

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";

  if (style === "bold" || style === "box") {
    const size = style === "bold" ? 92 : 74;
    ctx.font = `800 ${size}px ${font}`;
    const words = page.words.map((w) => (style === "bold" ? w.text.toUpperCase() : w.text));
    const space = ctx.measureText(" ").width;
    const widths = words.map((w) => ctx.measureText(w).width);
    // Zeilen bilden
    const lines: number[][] = [[]];
    let lineWidth = 0;
    widths.forEach((w, i) => {
      if (lineWidth + w > maxWidth && lines[lines.length - 1].length) {
        lines.push([]);
        lineWidth = 0;
      }
      lines[lines.length - 1].push(i);
      lineWidth += w + space;
    });
    const lineH = size * 1.18;
    const pop = Math.min(1, (t - page.start) / 0.12);
    const pageScale = 0.9 + 0.1 * easeOutBack(pop);
    lines.forEach((line, li) => {
      const total = line.reduce((n, i) => n + widths[i], 0) + space * (line.length - 1);
      let x = centerX - total / 2;
      const y = baseY + (li - (lines.length - 1) / 2) * lineH;
      if (style === "box") {
        ctx.fillStyle = tl.brand.primary;
        roundRect(ctx, x - 26, y - lineH / 2 - 4, total + 52, lineH + 8, 18);
        ctx.fill();
      }
      for (const i of line) {
        const isActive = i === active;
        ctx.save();
        const wx = x + widths[i] / 2;
        ctx.translate(wx, y);
        const s = pageScale * (isActive && style === "bold" ? 1.1 : 1);
        ctx.scale(s, s);
        if (style === "bold") {
          ctx.lineWidth = 14;
          ctx.strokeStyle = "rgba(0,0,0,0.92)";
          ctx.strokeText(words[i], -widths[i] / 2, 0);
          ctx.fillStyle = isActive ? hl : "#FFFFFF";
        } else {
          ctx.fillStyle = isActive ? readableOn(tl.brand.primary) : readableOn(tl.brand.primary) === "#FFFFFF" ? "rgba(255,255,255,0.78)" : "rgba(17,17,17,0.7)";
        }
        ctx.fillText(words[i], -widths[i] / 2, 0);
        ctx.restore();
        x += widths[i] + space;
      }
    });
  } else {
    const size = style === "karaoke" ? 66 : 58;
    ctx.font = `700 ${size}px ${font}`;
    const text = page.words.map((w) => w.text).join(" ");
    const lines = wrap(ctx, text, maxWidth);
    const lineH = size * 1.25;
    if (style === "clean") {
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      roundRect(ctx, centerX - widest / 2 - 28, baseY - (lines.length * lineH) / 2 - 16, widest + 56, lines.length * lineH + 32, 22);
      ctx.fill();
    }
    let wordIndex = 0;
    lines.forEach((line, li) => {
      const y = baseY + (li - (lines.length - 1) / 2) * lineH;
      const lineWords = line.split(" ");
      const total = ctx.measureText(line).width;
      let x = centerX - total / 2;
      for (const w of lineWords) {
        const idx = wordIndex++;
        const word = page.words[idx];
        ctx.lineWidth = 8;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        if (style === "karaoke") ctx.strokeText(w, x, y);
        if (style === "karaoke") {
          ctx.fillStyle = idx === active ? hl : word && t >= word.end ? "#FFFFFF" : "rgba(255,255,255,0.62)";
        } else {
          ctx.fillStyle = "#FFFFFF";
        }
        ctx.fillText(w, x, y);
        x += ctx.measureText(`${w} `).width;
      }
    });
  }
  ctx.restore();
}

export function drawOverlays(ctx: CanvasRenderingContext2D, overlays: TextOverlay[], t: number, tl: Timeline, font: string) {
  const W = tl.width;
  const H = tl.height;
  const hookActive = overlays.some((o) => o.kind === "hook" && t >= o.start && t < o.end);
  for (const o of overlays) {
    if (t < o.start || t >= o.end) continue;
    const local = t - o.start;
    const fadeOut = Math.min(1, (o.end - t) / 0.18);
    const pop = easeOutBack(Math.min(1, local / 0.2));
    ctx.save();
    ctx.globalAlpha = Math.max(0, fadeOut);
    if (o.kind === "hook") {
      const size = 76;
      ctx.font = `800 ${size}px ${font}`;
      const lines = wrap(ctx, o.text, W - 260);
      const lineH = size * 1.16;
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const boxW = widest + 70;
      const boxH = lines.length * lineH + 46;
      const cx = W / 2 - 20;
      const cy = H * 0.24;
      ctx.translate(cx, cy);
      ctx.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop);
      ctx.rotate(-0.018);
      ctx.fillStyle = tl.brand.primary;
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 30;
      roundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 24);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = readableOn(tl.brand.primary);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      lines.forEach((line, i) => ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * lineH));
    } else {
      const size = 54;
      ctx.font = `700 ${size}px ${font}`;
      const lines = wrap(ctx, o.text, W - 300);
      const lineH = size * 1.2;
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const boxW = widest + 56;
      const boxH = lines.length * lineH + 34;
      const cx = W / 2 - 20;
      const cy = hookActive ? H * 0.38 : H * 0.22;
      ctx.translate(cx, cy);
      ctx.scale(0.92 + 0.08 * pop, 0.92 + 0.08 * pop);
      ctx.fillStyle = "rgba(255,255,255,0.94)";
      roundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 20);
      ctx.fill();
      ctx.fillStyle = "#151515";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      lines.forEach((line, i) => ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * lineH));
    }
    ctx.restore();
  }
}

export function drawChrome(ctx: CanvasRenderingContext2D, t: number, tl: Timeline, logo: ImageBitmap | null) {
  if (logo && tl.brand.watermark) {
    const w = 150;
    const h = (logo.height / logo.width) * w;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.drawImage(logo, tl.width - w - 70, 150, w, h);
    ctx.restore();
  }
  if (tl.progressBar && tl.duration > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(0, tl.height - 10, tl.width, 10);
    ctx.fillStyle = highlightColor(tl.brand.primary);
    ctx.fillRect(0, tl.height - 10, (tl.width * Math.min(t, tl.duration)) / tl.duration, 10);
  }
}
