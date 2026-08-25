import { test } from "node:test";
import assert from "node:assert/strict";
import { detectPlatform, pickAssets, describeRelease, formatSize, formatDate, RELEASES } from "./site.js";

const WIN_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36";
const MAC_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.4 Safari/605.1.15";
const IPAD_DESKTOP_UA = MAC_UA; // iPadOS Safari masquerades as a Mac
const ANDROID_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/125.0 Mobile Safari/537.36";
const LINUX_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36";

test("detectPlatform prefers User-Agent Client Hints when present", () => {
  assert.equal(detectPlatform({ uaPlatform: "Windows", userAgent: MAC_UA }), "windows");
  assert.equal(detectPlatform({ uaPlatform: "macOS", userAgent: WIN_UA }), "mac");
});

test("detectPlatform falls back to navigator.platform, then the UA string", () => {
  assert.equal(detectPlatform({ navPlatform: "Win32" }), "windows");
  assert.equal(detectPlatform({ navPlatform: "MacIntel" }), "mac");
  assert.equal(detectPlatform({ userAgent: WIN_UA }), "windows");
  assert.equal(detectPlatform({ userAgent: MAC_UA }), "mac");
});

test("detectPlatform returns 'other' for phones, tablets, Linux and unknowns", () => {
  assert.equal(detectPlatform({ userAgent: ANDROID_UA, navPlatform: "Linux armv8l" }), "other");
  assert.equal(detectPlatform({ userAgent: IPAD_DESKTOP_UA, navPlatform: "MacIntel", maxTouchPoints: 5 }), "other");
  assert.equal(detectPlatform({ userAgent: LINUX_UA, navPlatform: "Linux x86_64" }), "other");
  assert.equal(detectPlatform({}), "other");
});

const ASSETS = [
  { name: "latest-mac.yml", size: 496, browser_download_url: "u/latest-mac.yml" },
  { name: "latest.yml", size: 337, browser_download_url: "u/latest.yml" },
  { name: "Peck-0.6.6-arm64-mac.zip", size: 226879073, browser_download_url: "u/mac.zip" },
  { name: "Peck-0.6.6-arm64.dmg.blockmap", size: 236197, browser_download_url: "u/dmg.blockmap" },
  { name: "Peck-0.6.6-arm64.dmg", size: 227578215, browser_download_url: "u/Peck-0.6.6-arm64.dmg" },
  { name: "Peck-Setup-0.6.6.exe.blockmap", size: 182951, browser_download_url: "u/exe.blockmap" },
  { name: "Peck-Setup-0.6.6.exe", size: 175631867, browser_download_url: "u/Peck-Setup-0.6.6.exe" },
];

test("pickAssets returns the .dmg and .exe installers, never blockmaps, zips or feeds", () => {
  const picked = pickAssets(ASSETS);
  assert.equal(picked.mac.url, "u/Peck-0.6.6-arm64.dmg");
  assert.equal(picked.mac.size, 227578215);
  assert.equal(picked.windows.url, "u/Peck-Setup-0.6.6.exe");
  assert.equal(picked.windows.size, 175631867);
});

test("pickAssets tolerates a release that is missing a platform", () => {
  const picked = pickAssets(ASSETS.filter((a) => !a.name.endsWith(".exe")));
  assert.equal(picked.mac.url, "u/Peck-0.6.6-arm64.dmg");
  assert.equal(picked.windows, null);
  assert.deepEqual(pickAssets([]), { mac: null, windows: null });
  assert.deepEqual(pickAssets(undefined), { mac: null, windows: null });
});

test("describeRelease strips the tag prefix and formats the publish date", () => {
  const info = describeRelease({ tag_name: "v0.6.6", published_at: "2026-08-25T02:08:30Z", assets: ASSETS });
  assert.equal(info.version, "0.6.6");
  assert.equal(info.date, "Aug 25, 2026");
  assert.equal(info.assets.mac.url, "u/Peck-0.6.6-arm64.dmg");
});

test("formatSize rounds to whole megabytes (base 10, like Finder)", () => {
  assert.equal(formatSize(227578215), "228 MB");
  assert.equal(formatSize(175631867), "176 MB");
});

test("formatDate is stable regardless of the visitor's time zone", () => {
  assert.equal(formatDate("2026-08-25T23:59:00Z"), "Aug 25, 2026");
  assert.equal(formatDate("not a date"), "");
});

test("RELEASES is the always-works fallback link", () => {
  assert.equal(RELEASES, "https://github.com/Devlin-Peck/peck-releases/releases");
});
