import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // studio/ ist eine eigene App neben der Website im Repo-Root.
  turbopack: { root },
  outputFileTracingRoot: root,
  // Die Agenten-Playbooks werden zur Laufzeit aus .claude/agents und prompts/ gelesen –
  // damit sie auch im Vercel-Deployment mitkommen, explizit einbinden.
  outputFileTracingIncludes: {
    "/api/**/*": ["./.claude/agents/**/*", "./prompts/**/*"],
  },
};

export default nextConfig;
