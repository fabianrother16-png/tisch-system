"use client";

import { CalendarPlus, Clapperboard, FileText, ListTodo, Plus, Receipt, UserPlus, Wallet } from "lucide-react";
import { Dropdown, DropdownItem } from "../ui/Dropdown";
import { Button } from "../ui/Button";

export function QuickCreate() {
  return (
    <Dropdown
      trigger={({ toggle }) => (
        <Button onClick={toggle} size="md" aria-haspopup="menu">
          <Plus />
          <span className="hidden sm:inline">Neu</span>
        </Button>
      )}
    >
      {(close) => (
        <div onClick={close}>
          <DropdownItem href="/kunden/neu" icon={<UserPlus />}>Kunde</DropdownItem>
          <DropdownItem href="/content?neu=1" icon={<Clapperboard />}>Content / Video</DropdownItem>
          <DropdownItem href="/kalender?neu=1" icon={<CalendarPlus />}>Termin</DropdownItem>
          <DropdownItem href="/aufgaben?neu=1" icon={<ListTodo />}>Aufgabe</DropdownItem>
          <div className="my-1 border-t border-line" />
          <DropdownItem href="/angebote/neu" icon={<FileText />}>Angebot</DropdownItem>
          <DropdownItem href="/rechnungen/neu" icon={<Receipt />}>Rechnung</DropdownItem>
          <DropdownItem href="/ausgaben?neu=1" icon={<Wallet />}>Ausgabe / Beleg</DropdownItem>
        </div>
      )}
    </Dropdown>
  );
}
