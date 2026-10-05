"use client";

import { createContext, useContext } from "react";

export interface StudioInfo {
  higgsfield: boolean;
  team: string[];
  /** Öffentliche Kundenansicht (Freigabe-Link) – keine internen Werkzeuge zeigen. */
  oeffentlich?: boolean;
}

const Ctx = createContext<StudioInfo>({ higgsfield: false, team: [] });

export function StudioProvider({ value, children }: { value: StudioInfo; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStudio = () => useContext(Ctx);
