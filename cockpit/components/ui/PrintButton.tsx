"use client";

import { Printer } from "lucide-react";
import { Button } from "./Button";

export function PrintButton({ label = "Als PDF speichern" }: { label?: string }) {
  return (
    <Button variant="secondary" onClick={() => window.print()} className="no-print">
      <Printer /> {label}
    </Button>
  );
}
