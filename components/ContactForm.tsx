"use client";

import { useState, type FormEvent } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  validateContactForm,
  isContactFormValid,
  type ContactFormData,
  type ContactFormErrors,
} from "@/lib/validation";

const initialData: ContactFormData = {
  name: "",
  zipCity: "",
  email: "",
  phone: "",
  message: "",
  website: "", // Honeypot
};

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [data, setData] = useState<ContactFormData>(initialData);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContactFormData, boolean>>>({});
  const [status, setStatus] = useState<SubmitState>("idle");

  const handleChange = (field: keyof ContactFormData, value: string) => {
    const next = { ...data, [field]: value };
    setData(next);
    if (touched[field]) {
      setErrors(validateContactForm(next));
    }
  };

  const handleBlur = (field: keyof ContactFormData) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validateContactForm(data));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateContactForm(data);
    setErrors(validationErrors);
    setTouched({
      name: true,
      zipCity: true,
      email: true,
      phone: true,
      message: true,
    });

    if (!isContactFormValid(validationErrors)) {
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Anfrage fehlgeschlagen");

      setStatus("success");
      setData(initialData);
      setTouched({});
      setErrors({});
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl2 border border-terracotta-100 bg-terracotta-50 p-8 text-center">
        <CheckCircle2 className="text-terracotta-500" size={36} />
        <h3 className="font-display text-xl font-semibold text-charcoal">
          Vielen Dank für Ihre Anfrage!
        </h3>
        <p className="text-sm text-charcoal-light">
          Wir haben Ihre Nachricht erhalten und melden uns in Kürze bei Ihnen.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="btn-secondary mt-2"
        >
          Neue Anfrage senden
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Honeypot-Feld: für Menschen unsichtbar, Bots füllen es oft trotzdem aus */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Bitte freilassen</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={data.website}
          onChange={(e) => handleChange("website", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Name"
          id="name"
          value={data.name}
          onChange={(v) => handleChange("name", v)}
          onBlur={() => handleBlur("name")}
          error={touched.name ? errors.name : undefined}
          autoComplete="name"
          placeholder="Max Mustermann"
        />
        <Field
          label="PLZ / Ort"
          id="zipCity"
          value={data.zipCity}
          onChange={(v) => handleChange("zipCity", v)}
          onBlur={() => handleBlur("zipCity")}
          error={touched.zipCity ? errors.zipCity : undefined}
          autoComplete="postal-code"
          placeholder="44369 Dortmund"
        />
        <Field
          label="E-Mail"
          id="email"
          type="email"
          value={data.email}
          onChange={(v) => handleChange("email", v)}
          onBlur={() => handleBlur("email")}
          error={touched.email ? errors.email : undefined}
          autoComplete="email"
          placeholder="max@beispiel.de"
        />
        <Field
          label="Telefon"
          id="phone"
          type="tel"
          value={data.phone}
          onChange={(v) => handleChange("phone", v)}
          onBlur={() => handleBlur("phone")}
          error={touched.phone ? errors.phone : undefined}
          autoComplete="tel"
          placeholder="0172 344 15 80"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-charcoal">
          Nachricht
        </label>
        <textarea
          id="message"
          rows={5}
          value={data.message}
          onChange={(e) => handleChange("message", e.target.value)}
          onBlur={() => handleBlur("message")}
          placeholder="Erzählen Sie uns kurz von Ihrem Vorhaben (Raum, Fläche, Wunschtermin ...)"
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-charcoal shadow-sm outline-none transition-colors focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 ${
            touched.message && errors.message ? "border-red-400" : "border-charcoal/15"
          }`}
        />
        {touched.message && errors.message && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle size={13} />
            {errors.message}
          </p>
        )}
      </div>

      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full sm:w-auto">
        {status === "submitting" ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Wird gesendet …
          </>
        ) : (
          "Anfrage absenden"
        )}
      </button>

      {status === "error" && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle size={15} />
          Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut
          oder rufen Sie uns direkt an.
        </p>
      )}
    </form>
  );
}

interface FieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}

function Field({
  label,
  id,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  autoComplete,
  placeholder,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-charcoal shadow-sm outline-none transition-colors focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 ${
          error ? "border-red-400" : "border-charcoal/15"
        }`}
      />
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle size={13} />
          {error}
        </p>
      )}
    </div>
  );
}
