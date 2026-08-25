// peck.devlin.ai download page.
//
// Pure helpers are exported so `node --test` can exercise them; the DOM wiring
// at the bottom only runs in a browser. The page must keep working with JS off
// or when api.github.com is unreachable: every link starts out pointing at the
// releases page and is only upgraded to a direct installer link once the
// latest-release lookup succeeds.

export const RELEASES = "https://github.com/Devlin-Peck/peck-releases/releases";
export const LATEST_API = "https://api.github.com/repos/Devlin-Peck/peck-releases/releases/latest";

export const PLATFORMS = {
  mac: { name: "macOS", detail: "Apple Silicon · .dmg", ext: ".dmg" },
  windows: { name: "Windows", detail: "64-bit · .exe", ext: ".exe" },
};

/** "mac" | "windows" | "other". Phones, tablets and Linux are "other": Peck has no build for them. */
export function detectPlatform({ userAgent = "", uaPlatform = "", navPlatform = "", maxTouchPoints = 0 } = {}) {
  const ua = String(userAgent).toLowerCase();
  if (/iphone|ipad|ipod|android/.test(ua)) return "other";
  const hint = String(uaPlatform || navPlatform || "").toLowerCase();
  if (hint.startsWith("win") || (!hint && /windows/.test(ua))) return "windows";
  const looksMac = hint.startsWith("mac") || (!hint && /macintosh|mac os x/.test(ua));
  // iPadOS Safari reports "MacIntel" with a Mac UA; touch points give it away.
  if (looksMac && maxTouchPoints > 1) return "other";
  if (looksMac) return "mac";
  return "other";
}

/** Direct installer links from a GitHub release's asset list. */
export function pickAssets(assets) {
  const list = Array.isArray(assets) ? assets : [];
  const find = (ext) => {
    const a = list.find((x) => typeof x?.name === "string" && x.name.endsWith(ext));
    return a ? { url: a.browser_download_url, size: a.size } : null;
  };
  return { mac: find(PLATFORMS.mac.ext), windows: find(PLATFORMS.windows.ext) };
}

export function formatSize(bytes) {
  return `${Math.round(bytes / 1e6)} MB`;
}

export function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(d);
}

export function describeRelease(release) {
  return {
    version: String(release?.tag_name ?? "").replace(/^v/, ""),
    date: formatDate(release?.published_at),
    assets: pickAssets(release?.assets),
  };
}

// ---- browser only ---------------------------------------------------------

function renderButton(el, key, asset) {
  const p = PLATFORMS[key];
  el.dataset.platform = key;
  el.querySelector(".btn-name").textContent = `Download for ${p.name}`;
  el.querySelector(".btn-detail").textContent = asset ? `${p.detail} · ${formatSize(asset.size)}` : p.detail;
  el.href = asset ? asset.url : RELEASES;
}

async function wire() {
  const nav = globalThis.navigator ?? {};
  const platform = detectPlatform({
    userAgent: nav.userAgent,
    uaPlatform: nav.userAgentData?.platform,
    navPlatform: nav.platform,
    maxTouchPoints: nav.maxTouchPoints,
  });
  document.documentElement.dataset.platform = platform;

  const primary = document.getElementById("dl-primary");
  const secondary = document.getElementById("dl-secondary");
  const order = platform === "windows" ? ["windows", "mac"] : ["mac", "windows"];
  renderButton(primary, order[0], null);
  renderButton(secondary, order[1], null);

  let release = null;
  try {
    const res = await fetch(LATEST_API, { headers: { Accept: "application/vnd.github+json" } });
    if (res.ok) release = describeRelease(await res.json());
  } catch {
    // Offline, rate-limited, or blocked: the releases-page links already work.
  }
  if (!release) return;

  renderButton(primary, order[0], release.assets[order[0]]);
  renderButton(secondary, order[1], release.assets[order[1]]);
  const version = document.getElementById("version");
  if (version && release.version) {
    version.textContent = `v${release.version}` + (release.date ? ` · ${release.date}` : "");
  }
}

if (typeof document !== "undefined") wire();
