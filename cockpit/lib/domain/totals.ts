export type LineItem = {
  title: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unitPrice: number; // Cent, netto
  taxRate: number;
  optional?: boolean;
};

export type Totals = {
  subtotal: number;
  discount: number;
  net: number;
  tax: number;
  gross: number;
  byRate: { rate: number; net: number; tax: number }[];
};

export function lineNet(item: Pick<LineItem, "quantity" | "unitPrice">): number {
  return Math.round(item.quantity * item.unitPrice);
}

/** Summen mit Rabatt und Umsatzsteuer je Steuersatz (Optionale Positionen zählen nicht). */
export function computeTotals(items: LineItem[], discountPercent = 0, kleinunternehmer = false): Totals {
  const counted = items.filter((i) => !i.optional);
  const subtotal = counted.reduce((s, i) => s + lineNet(i), 0);
  const factor = 1 - Math.min(Math.max(discountPercent, 0), 100) / 100;
  const rates = new Map<number, number>();
  for (const i of counted) {
    const rate = kleinunternehmer ? 0 : i.taxRate;
    rates.set(rate, (rates.get(rate) ?? 0) + lineNet(i));
  }
  const byRate = [...rates.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, base]) => {
      const net = Math.round(base * factor);
      return { rate, net, tax: Math.round((net * rate) / 100) };
    });
  const net = byRate.reduce((s, r) => s + r.net, 0);
  const tax = byRate.reduce((s, r) => s + r.tax, 0);
  return { subtotal, discount: subtotal - net, net, tax, gross: net + tax, byRate };
}
