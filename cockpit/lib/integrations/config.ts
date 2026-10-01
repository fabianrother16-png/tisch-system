import { decrypt } from "../crypto";
import { getSetting } from "../settings";
import { appUrl } from "../env";

export type ProviderKey = "tiktok" | "instagram" | "facebook" | "meta_ads" | "google_ads" | "google_business";

export const PROVIDERS: {
  key: ProviderKey;
  label: string;
  platform: string;
  app: "tiktok" | "instagram" | "meta" | "google";
  description: string;
  needs: string;
}[] = [
  {
    key: "instagram",
    label: "Instagram",
    platform: "instagram",
    app: "instagram",
    description: "Follower, Reels & Beiträge mit Aufrufen, Likes, Kommentaren, Shares und Saves.",
    needs: "Instagram-Business- oder Creator-Konto des Kunden",
  },
  {
    key: "tiktok",
    label: "TikTok",
    platform: "tiktok",
    app: "tiktok",
    description: "Follower, Likes und alle Videos mit Aufrufen, Likes, Kommentaren und Shares.",
    needs: "Login mit dem TikTok-Konto des Kunden",
  },
  {
    key: "facebook",
    label: "Facebook-Seite",
    platform: "facebook",
    app: "meta",
    description: "Seiten-Follower und Beiträge mit Reaktionen, Kommentaren und Shares.",
    needs: "Admin-Zugriff auf die Facebook-Seite",
  },
  {
    key: "meta_ads",
    label: "Meta Ads",
    platform: "meta",
    app: "meta",
    description: "Kampagnen auf Instagram & Facebook: Ausgaben, Reichweite, Klicks, Leads/Conversions.",
    needs: "Zugriff auf das Werbekonto des Kunden",
  },
  {
    key: "google_ads",
    label: "Google Ads",
    platform: "google",
    app: "google",
    description: "Kampagnen: Kosten, Impressionen, Klicks, Conversions.",
    needs: "Developer-Token + Zugriff auf das Google-Ads-Konto",
  },
  {
    key: "google_business",
    label: "Google-Unternehmensprofil",
    platform: "google",
    app: "google",
    description: "Website-Klicks, Anrufe, Routenanfragen, Profilaufrufe, Sterne & Bewertungen.",
    needs: "Inhaber- oder Manager-Zugriff auf das Profil",
  },
];

export function providerInfo(key: string) {
  return PROVIDERS.find((p) => p.key === key);
}

const ENV: Record<string, [string, string]> = {
  tiktok: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  instagram: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET"],
  meta: ["META_APP_ID", "META_APP_SECRET"],
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
};

/** Zugangsdaten der eigenen Entwickler-Apps: zuerst Einstellungen, dann Umgebungsvariablen. */
export async function appCredentials(app: "tiktok" | "instagram" | "meta" | "google") {
  const apps = await getSetting("oauthApps");
  const stored = apps[app];
  const clientId = stored?.clientId || process.env[ENV[app][0]] || "";
  const clientSecret = decrypt(stored?.clientSecret) || process.env[ENV[app][1]] || "";
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export async function extraSecrets() {
  const apps = await getSetting("oauthApps");
  return {
    googleAdsDeveloperToken: decrypt(apps.googleAds?.clientSecret) || process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
    googleAdsLoginCustomerId: (apps.googleAds?.clientId || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, ""),
    googlePlacesKey: decrypt(apps.googlePlaces?.clientSecret) || process.env.GOOGLE_PLACES_API_KEY || "",
  };
}

export const META_VERSION = () => process.env.META_GRAPH_VERSION || "v23.0";
export const GOOGLE_ADS_VERSION = () => process.env.GOOGLE_ADS_API_VERSION || "v21";

export function redirectUri(provider: ProviderKey) {
  return `${appUrl()}/api/oauth/${provider}/callback`;
}
