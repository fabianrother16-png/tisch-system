import { assertAccess, providerStatus } from "@/lib/studio/server/env";

// Liefert nur Ja/Nein-Infos, welche Dienste konfiguriert sind – nie die
// Schlüssel selbst. `authorized` sagt dem UI, ob das mitgeschickte
// Studio-Passwort stimmt.
export async function GET(request: Request) {
  let authorized = true;
  try {
    assertAccess(request);
  } catch {
    authorized = false;
  }
  return Response.json({ ...providerStatus(), authorized });
}
