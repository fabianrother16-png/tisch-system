"use client";

import { Clapperboard, Download, MonitorPlay, Music2, Clock3, Lightbulb } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { hashtagLine, slugify } from "@/lib/studio/format";
import { downloadText, scriptToMarkdown } from "@/lib/studio/markdown";
import type { Script } from "@/lib/studio/types";
import { Badge, Btn, Card, CopyButton, List, Modal, ScoreRing } from "./ui";

export function ScriptView({ script, label = "Skript", actions }: { script: Script; label?: string; actions?: React.ReactNode }) {
  const [prompter, setPrompter] = useState(false);
  const spoken = script.szenen.map((s) => s.gesprochen).filter(Boolean).join("\n\n");
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-start gap-5">
          <ScoreRing score={script.viralScore} label="Viral-Potenzial" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta-light">{label}</p>
            <h3 className="mt-1 font-serif text-2xl font-semibold">{script.titel}</h3>
            <p className="mt-2 text-sm text-cream/70">{script.kernidee}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{script.format}</Badge>
              <Badge>ca. {Math.round(script.laengeSekunden)} s</Badge>
              <Badge tone="accent">{script.zielplattform === "beide" ? "TikTok & Instagram" : script.zielplattform}</Badge>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {actions}
          <Btn size="sm" variant="secondary" icon={<MonitorPlay className="h-3.5 w-3.5" />} onClick={() => setPrompter(true)}>
            Teleprompter
          </Btn>
          <CopyButton text={scriptToMarkdown(script)} label="Skript kopieren" />
          <Btn
            size="sm"
            variant="secondary"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={() => downloadText(`${slugify(script.titel)}.md`, scriptToMarkdown(script))}
          >
            Markdown
          </Btn>
        </div>
      </Card>

      <Card>
        <h4 className="mb-3 font-serif text-lg font-semibold">Hooks – die ersten 2 Sekunden</h4>
        <div className="grid gap-3 lg:grid-cols-3">
          {script.hooks.map((h, i) => (
            <div key={i} className={i === 0 ? "rounded-xl border border-terracotta/50 bg-terracotta/10 p-4" : "rounded-xl bg-ink-700 p-4"}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Badge tone={i === 0 ? "accent" : "neutral"}>{i === 0 ? "Empfehlung" : `Variante ${i + 1}`}</Badge>
                <span className="text-xs text-cream/45">{h.typ}</span>
              </div>
              <p className="font-serif text-lg leading-snug">„{h.text}“</p>
              <p className="mt-2 text-xs text-cream/55">
                <span className="font-semibold text-cream/70">Bild:</span> {h.visuell}
              </p>
              <p className="mt-1 text-xs text-cream/55">{h.begruendung}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0 sm:p-0">
        <h4 className="px-5 pb-3 pt-5 font-serif text-lg font-semibold sm:px-6">Szenen</h4>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-ink-700 text-[11px] uppercase tracking-wider text-cream/50">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Zeit</th>
                <th className="px-4 py-2.5 font-semibold">Bild</th>
                <th className="px-4 py-2.5 font-semibold">Gesprochen</th>
                <th className="px-4 py-2.5 font-semibold">Text-Overlay</th>
                <th className="px-4 py-2.5 font-semibold">Schnitt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/[0.06] align-top">
              {script.szenen.map((s, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-terracotta-light">
                    {s.start}–{s.ende} s
                  </td>
                  <td className="px-4 py-3 text-cream/75">{s.bild}</td>
                  <td className="px-4 py-3 font-medium">{s.gesprochen || "–"}</td>
                  <td className="px-4 py-3 text-cream/75">{s.textEinblendung || "–"}</td>
                  <td className="px-4 py-3 text-xs text-cream/55">{s.schnittHinweis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-cream/[0.06] px-5 py-4 text-sm sm:px-6">
          <span className="font-semibold text-terracotta-light">CTA:</span> {script.cta}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="font-serif text-lg font-semibold">Caption & Hashtags</h4>
            <CopyButton text={`${script.caption}\n\n${hashtagLine(script.hashtagsTiktok)}`} label="TikTok" />
          </div>
          <p className="whitespace-pre-line text-sm text-cream/80">{script.caption}</p>
          <p className="mt-3 text-sm text-terracotta-light">
            <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-cream/45">TikTok</span>
            {hashtagLine(script.hashtagsTiktok)}
          </p>
          <p className="mt-2 text-sm text-terracotta-light">
            <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-cream/45">Instagram</span>
            {hashtagLine(script.hashtagsInstagram)}
          </p>
          <div className="mt-3">
            <CopyButton text={`${script.caption}\n\n${hashtagLine(script.hashtagsInstagram)}`} label="Instagram-Caption kopieren" />
          </div>
        </Card>
        <Card className="space-y-4">
          <div className="flex gap-3">
            <Music2 className="mt-0.5 h-4 w-4 shrink-0 text-terracotta-light" />
            <p className="text-sm text-cream/80">{script.sound}</p>
          </div>
          <div className="flex gap-3">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-terracotta-light" />
            <p className="text-sm text-cream/80">{script.postingZeit}</p>
          </div>
          {script.drehTipps.length > 0 && (
            <div className="flex gap-3">
              <Clapperboard className="mt-0.5 h-4 w-4 shrink-0 text-terracotta-light" />
              <List items={script.drehTipps} />
            </div>
          )}
        </Card>
      </div>

      {(script.warumDasFunktioniert.length > 0 || script.aenderungenZumEntwurf.length > 0) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {script.warumDasFunktioniert.length > 0 && (
            <Card>
              <h4 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
                <Lightbulb className="h-4 w-4 text-terracotta-light" /> Warum das funktioniert
              </h4>
              <List items={script.warumDasFunktioniert} tone="good" />
            </Card>
          )}
          {script.aenderungenZumEntwurf.length > 0 && (
            <Card>
              <h4 className="mb-3 font-serif text-lg font-semibold">Änderungen gegenüber dem Entwurf</h4>
              <List items={script.aenderungenZumEntwurf} />
            </Card>
          )}
        </div>
      )}

      <Teleprompter open={prompter} onClose={() => setPrompter(false)} text={`${script.hooks[0]?.text ?? ""}\n\n${spoken}`} />
    </div>
  );
}

function Teleprompter({ open, onClose, text }: { open: boolean; onClose: () => void; text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.2);
  useEffect(() => {
    if (!open || !playing) return;
    let frame = 0;
    const step = () => {
      if (ref.current) ref.current.scrollTop += speed;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [open, playing, speed]);
  return (
    <Modal open={open} onClose={onClose} title="Teleprompter" wide>
      <div ref={ref} className="h-[60vh] overflow-y-auto rounded-xl bg-black px-6 py-[30vh] text-center font-sans text-3xl font-semibold leading-relaxed text-white sm:text-5xl">
        {text.split("\n\n").map((p, i) => (
          <p key={i} className="mb-10">
            {p}
          </p>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Btn onClick={() => setPlaying((v) => !v)}>{playing ? "Pause" : "Start"}</Btn>
        <Btn variant="secondary" onClick={() => ref.current && (ref.current.scrollTop = 0)}>
          Von vorn
        </Btn>
        <label className="flex items-center gap-2 text-sm text-cream/60">
          Tempo
          <input type="range" min={0.4} max={3} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="accent-terracotta" />
        </label>
      </div>
    </Modal>
  );
}
