import { fmtNum, hashtagLine } from "./format";
import type { ResearchProject, Script } from "./types";

export function scriptToMarkdown(s: Script, heading = s.titel): string {
  const lines: string[] = [];
  lines.push(`# ${heading}`, "");
  lines.push(`**Kernidee:** ${s.kernidee}`, "");
  lines.push(`**Format:** ${s.format} · **Länge:** ca. ${Math.round(s.laengeSekunden)} s · **Plattform:** ${s.zielplattform} · **Viral-Score:** ${Math.round(s.viralScore)}/100`, "");
  lines.push("## Hooks", "");
  s.hooks.forEach((h, i) => {
    lines.push(`${i + 1}. **„${h.text}“** (${h.typ})${i === 0 ? " ← Empfehlung" : ""}`);
    lines.push(`   - Bild: ${h.visuell}`);
    lines.push(`   - Warum: ${h.begruendung}`);
  });
  lines.push("", "## Szenen", "");
  lines.push("| Zeit | Bild | Gesprochen | Text-Overlay | Schnitt |", "|---|---|---|---|---|");
  for (const sc of s.szenen) {
    const cell = (t: string) => (t || "–").replace(/\|/g, "/").replace(/\n/g, " ");
    lines.push(`| ${sc.start}–${sc.ende} s | ${cell(sc.bild)} | ${cell(sc.gesprochen)} | ${cell(sc.textEinblendung)} | ${cell(sc.schnittHinweis)} |`);
  }
  lines.push("", `**CTA:** ${s.cta}`, "");
  lines.push("## Caption", "", s.caption, "");
  lines.push(`**TikTok:** ${hashtagLine(s.hashtagsTiktok)}`, "");
  lines.push(`**Instagram:** ${hashtagLine(s.hashtagsInstagram)}`, "");
  lines.push(`**Sound:** ${s.sound}`, "", `**Posting-Zeit:** ${s.postingZeit}`, "");
  if (s.drehTipps.length) lines.push("## Dreh-Tipps", "", ...s.drehTipps.map((t) => `- ${t}`), "");
  if (s.warumDasFunktioniert.length) lines.push("## Warum das funktioniert", "", ...s.warumDasFunktioniert.map((t) => `- ${t}`), "");
  if (s.aenderungenZumEntwurf.length) lines.push("## Änderungen gegenüber dem Entwurf", "", ...s.aenderungenZumEntwurf.map((t) => `- ${t}`), "");
  return lines.join("\n");
}

export function researchToMarkdown(p: ResearchProject, clientName: string): string {
  const out: string[] = [`# ${p.title}`, "", `Kunde: ${clientName} · Erstellt: ${new Date(p.createdAt).toLocaleString("de-DE")}`, ""];
  if (p.selection && p.mainAnalysis) {
    out.push(`## Hauptkonkurrent: ${p.selection.hauptkonkurrent.key}`, "", p.mainAnalysis.kurzfazit, "");
    out.push("### Warum so viele Aufrufe", ...p.mainAnalysis.warumVieleAufrufe.map((e) => `- ${e.punkt} _(${e.beleg})_`), "");
    out.push("### Was sie richtig machen", ...p.mainAnalysis.wasSieRichtigMachen.map((e) => `- ${e.punkt} _(${e.beleg})_`), "");
    out.push("### Was sie falsch machen", ...p.mainAnalysis.wasSieFalschMachen.map((e) => `- ${e.punkt} _(${e.beleg})_`), "");
    out.push("### Chancen für uns", ...p.mainAnalysis.chancenFuerUns.map((c) => `- ${c}`), "");
  }
  if (p.competitorAnalyses) {
    out.push("## Weitere Konkurrenten", "");
    for (const [key, a] of Object.entries(p.competitorAnalyses)) {
      out.push(`### ${key} (Bewertung ${a.bewertung}/10)`, a.kurzprofil, "", `**Warum Aufrufe:** ${a.warumAufrufe}`, "");
      out.push("Richtig:", ...a.richtig.map((r) => `- ${r}`), "", "Falsch:", ...a.falsch.map((r) => `- ${r}`), "");
      out.push(`**Übertragbare Idee:** ${a.uebertragbareIdee}`, "");
    }
  }
  if (p.synthesis) {
    out.push("## Muster über alle Konkurrenten", "");
    out.push(...p.synthesis.erfolgsmuster.map((m) => `- **${m.muster}** (${m.verbreitung}): ${m.anwendung}`), "");
    out.push("### Häufige Fehler", ...p.synthesis.haeufigeFehler.map((f) => `- ${f.fehler} → ${f.besserMachen}`), "");
    out.push("### Content-Lücken", ...p.synthesis.contentLuecken.map((l) => `- ${l.luecke} → ${l.idee}`), "");
  }
  if (p.trends) {
    out.push("## Trends", "", p.trends.zusammenfassung, "");
    out.push(...p.trends.trends.map((t) => `- **${t.name}** (${t.typ}, Passung ${t.passung}/10): ${t.umsetzung}`), "");
    if (p.trends.quellen.length) out.push("Quellen:", ...p.trends.quellen.map((q) => `- [${q.title}](${q.url})`), "");
  }
  if (p.dataTrends) {
    out.push(
      "### Daten",
      `Top-Hashtags: ${p.dataTrends.hashtags.slice(0, 12).map((h) => `#${h.tag} (${fmtNum(h.views)})`).join(", ")}`,
      "",
    );
  }
  if (p.final) out.push(scriptToMarkdown(p.final, `Finales Skript: ${p.final.titel}`), "");
  else if (p.draft) out.push(scriptToMarkdown(p.draft, `Entwurf: ${p.draft.titel}`), "");
  return out.join("\n");
}

export function downloadText(filename: string, text: string, type = "text/markdown") {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
