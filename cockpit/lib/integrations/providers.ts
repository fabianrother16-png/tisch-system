import { eq } from "drizzle-orm";
import { db } from "../db";
import { integrations, type Integration } from "../db/schema";
import { decrypt, encrypt } from "../crypto";
import { addDays, todayISO, toBerlinDate } from "../dates";
import { appCredentials, extraSecrets, GOOGLE_ADS_VERSION, META_VERSION, redirectUri, type ProviderKey, providerInfo } from "./config";
import { form, getJson } from "./http";
import { upsertAdStat, upsertCampaign, upsertMetric, upsertPost } from "./store";

export type Choice = { id: string; name: string };
export type TokenSet = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  scopes?: string | null;
  externalId?: string | null;
  name?: string | null;
  choices?: Choice[];
};

const GOOGLE_SCOPES: Record<string, string> = {
  google_ads: "https://www.googleapis.com/auth/adwords",
  google_business: "https://www.googleapis.com/auth/business.manage",
};

const expiresIn = (sec: number | undefined) => (sec ? new Date(Date.now() + sec * 1000).toISOString() : null);

// ─── OAuth: Anmeldeseite ───────────────────────────────────────────────────

export async function authorizeUrl(provider: ProviderKey, state: string): Promise<string> {
  const info = providerInfo(provider)!;
  const creds = await appCredentials(info.app);
  if (!creds) throw new Error(`Für ${info.label} sind noch keine App-Zugangsdaten hinterlegt (Einstellungen → Anbindungen).`);
  const redirect = redirectUri(provider);
  switch (provider) {
    case "tiktok":
      return `https://www.tiktok.com/v2/auth/authorize/?${form({
        client_key: creds.clientId,
        scope: "user.info.basic,user.info.stats,video.list",
        response_type: "code",
        redirect_uri: redirect,
        state,
      })}`;
    case "instagram":
      return `https://www.instagram.com/oauth/authorize?${form({
        enable_fb_login: "0",
        force_authentication: "1",
        client_id: creds.clientId,
        redirect_uri: redirect,
        response_type: "code",
        scope: "instagram_business_basic,instagram_business_manage_insights",
        state,
      })}`;
    case "facebook":
    case "meta_ads":
      return `https://www.facebook.com/${META_VERSION()}/dialog/oauth?${form({
        client_id: creds.clientId,
        redirect_uri: redirect,
        state,
        response_type: "code",
        scope:
          provider === "facebook"
            ? "pages_show_list,pages_read_engagement,read_insights"
            : "ads_read,business_management",
      })}`;
    case "google_ads":
    case "google_business":
      return `https://accounts.google.com/o/oauth2/v2/auth?${form({
        client_id: creds.clientId,
        redirect_uri: redirect,
        response_type: "code",
        scope: GOOGLE_SCOPES[provider],
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        state,
      })}`;
  }
}

// ─── OAuth: Code gegen Tokens tauschen ─────────────────────────────────────

export async function exchangeCode(provider: ProviderKey, code: string): Promise<TokenSet> {
  const info = providerInfo(provider)!;
  const creds = (await appCredentials(info.app))!;
  const redirect = redirectUri(provider);
  const v = META_VERSION();

  if (provider === "tiktok") {
    const t = await getJson<{ access_token: string; refresh_token: string; expires_in: number; open_id: string; scope: string }>(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ client_key: creds.clientId, client_secret: creds.clientSecret, code, grant_type: "authorization_code", redirect_uri: redirect }),
      },
    );
    let name: string | null = null;
    try {
      const u = await getJson<{ data: { user: { display_name?: string; username?: string } } }>(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username",
        { headers: { Authorization: `Bearer ${t.access_token}` } },
      );
      name = u.data.user.username ? `@${u.data.user.username}` : u.data.user.display_name ?? null;
    } catch {}
    return { accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt: expiresIn(t.expires_in), scopes: t.scope, externalId: t.open_id, name };
  }

  if (provider === "instagram") {
    const short = await getJson<{ access_token: string; user_id: number | string }>("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form({ client_id: creds.clientId, client_secret: creds.clientSecret, grant_type: "authorization_code", redirect_uri: redirect, code }),
    });
    const long = await getJson<{ access_token: string; expires_in: number }>(
      `https://graph.instagram.com/access_token?${form({ grant_type: "ig_exchange_token", client_secret: creds.clientSecret, access_token: short.access_token })}`,
    );
    const me = await getJson<{ user_id?: string; id: string; username?: string }>(
      `https://graph.instagram.com/${v}/me?${form({ fields: "user_id,username", access_token: long.access_token })}`,
    );
    return { accessToken: long.access_token, expiresAt: expiresIn(long.expires_in), externalId: me.user_id ?? me.id, name: me.username ? `@${me.username}` : null };
  }

  if (provider === "facebook" || provider === "meta_ads") {
    const short = await getJson<{ access_token: string }>(
      `https://graph.facebook.com/${v}/oauth/access_token?${form({ client_id: creds.clientId, redirect_uri: redirect, client_secret: creds.clientSecret, code })}`,
    );
    const long = await getJson<{ access_token: string; expires_in?: number }>(
      `https://graph.facebook.com/${v}/oauth/access_token?${form({ grant_type: "fb_exchange_token", client_id: creds.clientId, client_secret: creds.clientSecret, fb_exchange_token: short.access_token })}`,
    );
    const choices: Choice[] = [];
    if (provider === "facebook") {
      const pages = await getJson<{ data: { id: string; name: string }[] }>(
        `https://graph.facebook.com/${v}/me/accounts?${form({ fields: "id,name", limit: "100", access_token: long.access_token })}`,
      );
      choices.push(...pages.data.map((p) => ({ id: p.id, name: p.name })));
    } else {
      const accounts = await getJson<{ data: { id: string; name: string }[] }>(
        `https://graph.facebook.com/${v}/me/adaccounts?${form({ fields: "id,name,account_status", limit: "100", access_token: long.access_token })}`,
      );
      choices.push(...accounts.data.map((a) => ({ id: a.id, name: a.name || a.id })));
    }
    return { accessToken: long.access_token, expiresAt: expiresIn(long.expires_in ?? 60 * 24 * 3600), choices };
  }

  // Google
  const t = await getJson<{ access_token: string; refresh_token?: string; expires_in: number; scope: string }>("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form({ code, client_id: creds.clientId, client_secret: creds.clientSecret, redirect_uri: redirect, grant_type: "authorization_code" }),
  });
  const choices = provider === "google_ads" ? await googleAdsCustomers(t.access_token) : await googleBusinessLocations(t.access_token);
  return { accessToken: t.access_token, refreshToken: t.refresh_token ?? null, expiresAt: expiresIn(t.expires_in), scopes: t.scope, choices };
}

async function googleAdsCustomers(token: string): Promise<Choice[]> {
  const { googleAdsDeveloperToken, googleAdsLoginCustomerId } = await extraSecrets();
  if (!googleAdsDeveloperToken) return [];
  const res = await getJson<{ resourceNames: string[] }>(`https://googleads.googleapis.com/${GOOGLE_ADS_VERSION()}/customers:listAccessibleCustomers`, {
    headers: { Authorization: `Bearer ${token}`, "developer-token": googleAdsDeveloperToken },
  });
  const ids = res.resourceNames.map((r) => r.split("/")[1]);
  const choices: Choice[] = [];
  for (const id of ids.slice(0, 25)) {
    let name = `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`;
    try {
      const r = await getJson<{ results?: { customer: { descriptiveName?: string } }[] }>(
        `https://googleads.googleapis.com/${GOOGLE_ADS_VERSION()}/customers/${id}/googleAds:search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "developer-token": googleAdsDeveloperToken,
            "Content-Type": "application/json",
            ...(googleAdsLoginCustomerId ? { "login-customer-id": googleAdsLoginCustomerId } : {}),
          },
          body: JSON.stringify({ query: "SELECT customer.descriptive_name FROM customer LIMIT 1" }),
        },
      );
      const d = r.results?.[0]?.customer.descriptiveName;
      if (d) name = `${d} (${name})`;
    } catch {}
    choices.push({ id, name });
  }
  return choices;
}

async function googleBusinessLocations(token: string): Promise<Choice[]> {
  const accounts = await getJson<{ accounts?: { name: string; accountName: string }[] }>("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const choices: Choice[] = [];
  for (const a of accounts.accounts ?? []) {
    try {
      const locs = await getJson<{ locations?: { name: string; title: string }[] }>(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${a.name}/locations?readMask=name,title&pageSize=100`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      for (const l of locs.locations ?? []) choices.push({ id: `${a.name}/${l.name}`, name: l.title });
    } catch {}
  }
  return choices;
}

// ─── Token erneuern ────────────────────────────────────────────────────────

async function freshToken(row: Integration): Promise<string> {
  const token = decrypt(row.accessToken);
  if (!token) throw new Error("Kein Zugangstoken gespeichert – bitte neu verbinden.");
  const expires = row.expiresAt ? new Date(row.expiresAt).getTime() : null;
  const soon = expires != null && expires - Date.now() < 10 * 60 * 1000;
  const info = providerInfo(row.provider)!;

  if (row.provider === "instagram" && expires != null && expires - Date.now() < 7 * 24 * 3600 * 1000) {
    if (expires < Date.now()) throw new Error("Instagram-Zugang abgelaufen – bitte neu verbinden.");
    const r = await getJson<{ access_token: string; expires_in: number }>(
      `https://graph.instagram.com/refresh_access_token?${form({ grant_type: "ig_refresh_token", access_token: token })}`,
    );
    await db.update(integrations).set({ accessToken: encrypt(r.access_token), expiresAt: expiresIn(r.expires_in) }).where(eq(integrations.id, row.id));
    return r.access_token;
  }
  if (!soon) return token;

  const refresh = decrypt(row.refreshToken);
  const creds = await appCredentials(info.app);
  if (!creds) throw new Error("App-Zugangsdaten fehlen.");
  if (row.provider === "tiktok" && refresh) {
    const t = await getJson<{ access_token: string; refresh_token: string; expires_in: number }>("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form({ client_key: creds.clientId, client_secret: creds.clientSecret, grant_type: "refresh_token", refresh_token: refresh }),
    });
    await db
      .update(integrations)
      .set({ accessToken: encrypt(t.access_token), refreshToken: encrypt(t.refresh_token), expiresAt: expiresIn(t.expires_in) })
      .where(eq(integrations.id, row.id));
    return t.access_token;
  }
  if ((row.provider === "google_ads" || row.provider === "google_business") && refresh) {
    const t = await getJson<{ access_token: string; expires_in: number }>("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form({ client_id: creds.clientId, client_secret: creds.clientSecret, refresh_token: refresh, grant_type: "refresh_token" }),
    });
    await db.update(integrations).set({ accessToken: encrypt(t.access_token), expiresAt: expiresIn(t.expires_in) }).where(eq(integrations.id, row.id));
    return t.access_token;
  }
  if (row.provider === "facebook" && row.externalId) return token; // Seiten-Token läuft nicht ab
  if (expires != null && expires < Date.now()) throw new Error("Zugang abgelaufen – bitte neu verbinden.");
  return token;
}

// ─── Auswahl (Seite, Werbekonto, Standort) speichern ──────────────────────

export async function applyChoice(row: Integration, choiceId: string): Promise<{ externalId: string; name: string; accessToken?: string; refreshToken?: string }> {
  const choices: Choice[] = JSON.parse(row.config.choices ?? "[]");
  const choice = choices.find((c) => c.id === choiceId);
  if (!choice) throw new Error("Auswahl nicht gefunden");
  if (row.provider === "facebook") {
    const userToken = decrypt(row.accessToken)!;
    const page = await getJson<{ access_token: string }>(
      `https://graph.facebook.com/${META_VERSION()}/${choice.id}?${form({ fields: "access_token", access_token: userToken })}`,
    );
    return { externalId: choice.id, name: choice.name, accessToken: page.access_token, refreshToken: userToken };
  }
  return { externalId: choice.id, name: choice.name };
}

// ─── Synchronisation ───────────────────────────────────────────────────────

const unix = (s: number) => toBerlinDate(new Date(s * 1000));

export async function syncIntegration(row: Integration, days = 30): Promise<string> {
  if (!row.externalId) throw new Error("Bitte zuerst Konto/Seite/Standort auswählen.");
  const token = await freshToken(row);
  const today = todayISO();
  const since = addDays(today, -days);
  const v = META_VERSION();
  const cid = row.customerId;

  switch (row.provider) {
    case "tiktok": {
      const u = await getJson<{ data: { user: { follower_count?: number; likes_count?: number; video_count?: number } } }>(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,follower_count,likes_count,video_count",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (u.data.user.follower_count != null) await upsertMetric(cid, "tiktok", "followers", today, u.data.user.follower_count);
      if (u.data.user.likes_count != null) await upsertMetric(cid, "tiktok", "likes_total", today, u.data.user.likes_count);
      let cursor: number | undefined;
      let count = 0;
      for (let page = 0; page < 5; page++) {
        const r = await getJson<{
          data: {
            videos: { id: string; title?: string; video_description?: string; create_time: number; cover_image_url?: string; share_url?: string; view_count?: number; like_count?: number; comment_count?: number; share_count?: number }[];
            cursor: number;
            has_more: boolean;
          };
        }>("https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,create_time,cover_image_url,share_url,view_count,like_count,comment_count,share_count", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ max_count: 20, ...(cursor ? { cursor } : {}) }),
        });
        for (const vdo of r.data.videos ?? []) {
          await upsertPost(cid, {
            platform: "tiktok",
            externalId: vdo.id,
            url: vdo.share_url,
            caption: vdo.title || vdo.video_description,
            mediaType: "Video",
            thumbnailUrl: vdo.cover_image_url,
            publishedAt: unix(vdo.create_time),
            views: vdo.view_count,
            likes: vdo.like_count,
            comments: vdo.comment_count,
            shares: vdo.share_count,
          });
          count++;
        }
        if (!r.data.has_more) break;
        cursor = r.data.cursor;
      }
      return `${count} Videos aktualisiert`;
    }

    case "instagram": {
      const base = `https://graph.instagram.com/${v}`;
      const me = await getJson<{ followers_count?: number; media_count?: number }>(`${base}/me?${form({ fields: "followers_count,media_count,username", access_token: token })}`);
      if (me.followers_count != null) await upsertMetric(cid, "instagram", "followers", today, me.followers_count);
      try {
        const ins = await getJson<{ data: { name: string; values: { value: number; end_time: string }[] }[] }>(
          `${base}/me/insights?${form({ metric: "reach", period: "day", since: String(Math.floor(new Date(since).getTime() / 1000)), until: String(Math.floor(Date.now() / 1000)), access_token: token })}`,
        );
        for (const m of ins.data) for (const val of m.values) await upsertMetric(cid, "instagram", m.name, addDays(val.end_time.slice(0, 10), -1), val.value);
      } catch {}
      const media = await getJson<{
        data: { id: string; caption?: string; media_type: string; media_product_type?: string; permalink: string; thumbnail_url?: string; media_url?: string; timestamp: string; like_count?: number; comments_count?: number }[];
      }>(`${base}/me/media?${form({ fields: "id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count", limit: "50", access_token: token })}`);
      let count = 0;
      for (const m of media.data) {
        const metrics: Record<string, number> = {};
        try {
          const ins = await getJson<{ data: { name: string; values?: { value: number }[]; total_value?: { value: number } }[] }>(
            `${base}/${m.id}/insights?${form({ metric: "views,reach,saved,shares", access_token: token })}`,
          );
          for (const d of ins.data) metrics[d.name] = d.values?.[0]?.value ?? d.total_value?.value ?? 0;
        } catch {}
        await upsertPost(cid, {
          platform: "instagram",
          externalId: m.id,
          url: m.permalink,
          caption: m.caption?.slice(0, 500),
          mediaType: m.media_product_type === "REELS" ? "Reel" : m.media_type === "CAROUSEL_ALBUM" ? "Karussell" : m.media_type === "VIDEO" ? "Video" : "Bild",
          thumbnailUrl: m.thumbnail_url ?? m.media_url,
          publishedAt: toBerlinDate(new Date(m.timestamp)),
          views: metrics.views,
          reach: metrics.reach,
          likes: m.like_count,
          comments: m.comments_count,
          saves: metrics.saved,
          shares: metrics.shares,
        });
        count++;
      }
      return `${count} Beiträge aktualisiert`;
    }

    case "facebook": {
      const base = `https://graph.facebook.com/${v}`;
      const page = await getJson<{ followers_count?: number; fan_count?: number }>(`${base}/${row.externalId}?${form({ fields: "followers_count,fan_count", access_token: token })}`);
      await upsertMetric(cid, "facebook", "followers", today, page.followers_count ?? page.fan_count ?? 0);
      const feed = await getJson<{
        data: { id: string; message?: string; created_time: string; permalink_url?: string; full_picture?: string; shares?: { count: number }; reactions?: { summary: { total_count: number } }; comments?: { summary: { total_count: number } } }[];
      }>(
        `${base}/${row.externalId}/posts?${form({ fields: "id,message,created_time,permalink_url,full_picture,shares,reactions.summary(true).limit(0),comments.summary(true).limit(0)", limit: "50", access_token: token })}`,
      );
      for (const p of feed.data) {
        let views = 0;
        try {
          const ins = await getJson<{ data: { name: string; values: { value: number }[] }[] }>(`${base}/${p.id}/insights?${form({ metric: "post_impressions_unique", access_token: token })}`);
          views = ins.data[0]?.values[0]?.value ?? 0;
        } catch {}
        await upsertPost(cid, {
          platform: "facebook",
          externalId: p.id,
          url: p.permalink_url,
          caption: p.message?.slice(0, 500),
          mediaType: "Beitrag",
          thumbnailUrl: p.full_picture,
          publishedAt: toBerlinDate(new Date(p.created_time)),
          reach: views,
          views,
          likes: p.reactions?.summary.total_count,
          comments: p.comments?.summary.total_count,
          shares: p.shares?.count,
        });
      }
      return `${feed.data.length} Beiträge aktualisiert`;
    }

    case "meta_ads": {
      const base = `https://graph.facebook.com/${v}`;
      const CONVERSIONS = ["lead", "purchase", "complete_registration", "contact", "onsite_conversion.lead_grouped", "onsite_conversion.messaging_conversation_started_7d"];
      let url: string | null = `${base}/${row.externalId}/insights?${form({
        level: "campaign",
        fields: "campaign_id,campaign_name,spend,impressions,reach,clicks,actions,action_values",
        time_increment: "1",
        time_range: JSON.stringify({ since, until: today }),
        limit: "500",
        access_token: token,
      })}`;
      let rows = 0;
      while (url && rows < 5000) {
        const r: {
          data: { campaign_id: string; campaign_name: string; date_start: string; spend?: string; impressions?: string; reach?: string; clicks?: string; actions?: { action_type: string; value: string }[]; action_values?: { action_type: string; value: string }[] }[];
          paging?: { next?: string };
        } = await getJson(url);
        for (const d of r.data) {
          const campaignId = await upsertCampaign(cid, "meta", d.campaign_id, d.campaign_name);
          const conv = (d.actions ?? []).filter((a) => CONVERSIONS.includes(a.action_type)).reduce((s, a) => s + Number(a.value), 0);
          const convValue = (d.action_values ?? []).filter((a) => a.action_type === "purchase").reduce((s, a) => s + Number(a.value), 0);
          await upsertAdStat(campaignId, d.date_start, {
            spend: Number(d.spend ?? 0) * 100,
            impressions: Number(d.impressions ?? 0),
            reach: Number(d.reach ?? 0),
            clicks: Number(d.clicks ?? 0),
            conversions: conv,
            conversionValue: convValue * 100,
          });
          rows++;
        }
        url = r.paging?.next ?? null;
      }
      return `${rows} Tageswerte aus Kampagnen aktualisiert`;
    }

    case "google_ads": {
      const { googleAdsDeveloperToken, googleAdsLoginCustomerId } = await extraSecrets();
      if (!googleAdsDeveloperToken) throw new Error("Google-Ads-Developer-Token fehlt (Einstellungen → Anbindungen).");
      const r = await getJson<{
        results?: { campaign: { id: string; name: string; status: string }; segments: { date: string }; metrics: { costMicros?: string; impressions?: string; clicks?: string; conversions?: number; conversionsValue?: number } }[];
      }>(`https://googleads.googleapis.com/${GOOGLE_ADS_VERSION()}/customers/${row.externalId}/googleAds:search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "developer-token": googleAdsDeveloperToken,
          "Content-Type": "application/json",
          ...(googleAdsLoginCustomerId ? { "login-customer-id": googleAdsLoginCustomerId } : {}),
        },
        body: JSON.stringify({
          query: `SELECT campaign.id, campaign.name, campaign.status, segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN '${since}' AND '${today}'`,
        }),
      });
      for (const x of r.results ?? []) {
        const campaignId = await upsertCampaign(cid, "google", x.campaign.id, x.campaign.name, x.campaign.status === "ENABLED" ? "aktiv" : "pausiert");
        await upsertAdStat(campaignId, x.segments.date, {
          spend: Number(x.metrics.costMicros ?? 0) / 10_000,
          impressions: Number(x.metrics.impressions ?? 0),
          clicks: Number(x.metrics.clicks ?? 0),
          conversions: Number(x.metrics.conversions ?? 0),
          conversionValue: Number(x.metrics.conversionsValue ?? 0) * 100,
        });
      }
      return `${r.results?.length ?? 0} Tageswerte aktualisiert`;
    }

    case "google_business": {
      const [account, locationId] = row.externalId.split("/locations/");
      const location = `locations/${locationId}`;
      const [sy, sm, sd] = since.split("-").map(Number);
      const [ey, em, ed] = addDays(today, -1).split("-").map(Number);
      const metricMap: Record<string, string> = {
        WEBSITE_CLICKS: "website_clicks",
        CALL_CLICKS: "call_clicks",
        BUSINESS_DIRECTION_REQUESTS: "direction_requests",
        BUSINESS_IMPRESSIONS_DESKTOP_MAPS: "impressions",
        BUSINESS_IMPRESSIONS_DESKTOP_SEARCH: "impressions",
        BUSINESS_IMPRESSIONS_MOBILE_MAPS: "impressions",
        BUSINESS_IMPRESSIONS_MOBILE_SEARCH: "impressions",
      };
      const params = new URLSearchParams();
      for (const m of Object.keys(metricMap)) params.append("dailyMetrics", m);
      params.set("dailyRange.start_date.year", String(sy));
      params.set("dailyRange.start_date.month", String(sm));
      params.set("dailyRange.start_date.day", String(sd));
      params.set("dailyRange.end_date.year", String(ey));
      params.set("dailyRange.end_date.month", String(em));
      params.set("dailyRange.end_date.day", String(ed));
      const r = await getJson<{
        multiDailyMetricTimeSeries?: { dailyMetricTimeSeries: { dailyMetric: string; timeSeries: { datedValues: { date: { year: number; month: number; day: number }; value?: string }[] } }[] }[];
      }>(`https://businessprofileperformance.googleapis.com/v1/${location}:fetchMultiDailyMetricsTimeSeries?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sums = new Map<string, number>();
      for (const group of r.multiDailyMetricTimeSeries ?? []) {
        for (const series of group.dailyMetricTimeSeries) {
          const key = metricMap[series.dailyMetric];
          for (const dv of series.timeSeries.datedValues) {
            const date = `${dv.date.year}-${String(dv.date.month).padStart(2, "0")}-${String(dv.date.day).padStart(2, "0")}`;
            const k = `${key}|${date}`;
            sums.set(k, (sums.get(k) ?? 0) + Number(dv.value ?? 0));
          }
        }
      }
      for (const [k, val] of sums) {
        const [metric, date] = k.split("|");
        await upsertMetric(cid, "google", metric, date, val);
      }
      try {
        const reviews = await getJson<{ averageRating?: number; totalReviewCount?: number }>(
          `https://mybusiness.googleapis.com/v4/${account}/${location}/reviews?pageSize=1`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (reviews.averageRating != null) await upsertMetric(cid, "google", "rating", today, reviews.averageRating);
        if (reviews.totalReviewCount != null) await upsertMetric(cid, "google", "review_count", today, reviews.totalReviewCount);
      } catch {}
      return `${sums.size} Tageswerte aktualisiert`;
    }
    default:
      throw new Error(`Unbekannter Anbieter: ${row.provider}`);
  }
}

/** Sterne & Bewertungsanzahl über die Places API (nur API-Schlüssel nötig, kein Kunden-Login) */
export async function syncPlaces(customerId: number, placeId: string): Promise<string> {
  const { googlePlacesKey } = await extraSecrets();
  if (!googlePlacesKey) throw new Error("Kein Google-Places-API-Schlüssel hinterlegt.");
  const r = await getJson<{ rating?: number; userRatingCount?: number }>(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": googlePlacesKey, "X-Goog-FieldMask": "rating,userRatingCount" },
  });
  const today = todayISO();
  if (r.rating != null) await upsertMetric(customerId, "google", "rating", today, r.rating);
  if (r.userRatingCount != null) await upsertMetric(customerId, "google", "review_count", today, r.userRatingCount);
  return `${r.rating ?? "–"} Sterne, ${r.userRatingCount ?? 0} Bewertungen`;
}
