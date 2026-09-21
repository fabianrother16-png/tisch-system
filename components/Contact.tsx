"use client";

import { useState, type FormEvent } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { Button } from "./ui/Button";
import { SITE } from "@/lib/constants";

type Status = "idle" | "loading" | "success" | "error";

const inputClasses =
  "w-full rounded-xl border border-anthracite/15 bg-cream px-4 py-3.5 font-sans text-base text-anthracite placeholder:text-anthracite/40 transition-colors focus:border-terracotta focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = event.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)
        .value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Etwas ist schiefgelaufen.");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Etwas ist schiefgelaufen."
      );
    }
  }

  return (
    <section id="kontakt" className="bg-cream py-28 md:py-36">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Kontakt"
              title={
                <>
                  Lass uns
                  <br />
                  sichtbar werden.
                </>
              }
              description="Kostenloses und unverbindliches Erstgespräch – wir hören zu, bevor wir Vorschläge machen."
            />

            <ul className="mt-10 space-y-5">
              <li className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-anthracite text-cream">
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <a
                  href={`mailto:${SITE.email}`}
                  className="font-sans text-base text-anthracite/80 hover:text-terracotta-dark"
                >
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-anthracite text-cream">
                  <Phone className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <a
                  href={`tel:${SITE.phoneHref}`}
                  className="font-sans text-base text-anthracite/80 hover:text-terracotta-dark"
                >
                  {SITE.phone}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-anthracite text-cream">
                  <MapPin className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="font-sans text-base text-anthracite/80">
                  {SITE.addressLine}
                </span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <Reveal>
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="name" className="mb-2 block font-sans text-sm font-medium text-anthracite/80">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    className={inputClasses}
                    placeholder="Dein Name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block font-sans text-sm font-medium text-anthracite/80">
                    E-Mail
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={inputClasses}
                    placeholder="name@unternehmen.de"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="mb-2 block font-sans text-sm font-medium text-anthracite/80">
                    Nachricht
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className={`${inputClasses} resize-none`}
                    placeholder="Erzähl uns kurz von deinem Betrieb und deinen Zielen."
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button type="submit" variant="primary" disabled={status === "loading"}>
                    {status === "loading" ? "Wird gesendet…" : "Nachricht senden"}
                  </Button>
                  <div role="status" aria-live="polite">
                    {status === "success" && (
                      <span className="font-sans text-sm text-terracotta-dark">
                        Danke! Wir melden uns in Kürze bei dir.
                      </span>
                    )}
                    {status === "error" && (
                      <span className="font-sans text-sm text-red-700">{errorMsg}</span>
                    )}
                  </div>
                </div>
              </form>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
