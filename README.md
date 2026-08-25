# Peck releases

Downloads and auto-update feed for **Peck — by devlin.ai**: run many Claude
Code agents in parallel, each in its own container on its own git worktree.

**Download:** [peck.devlin.ai](https://peck.devlin.ai) picks the right
installer for your OS, or grab the `.dmg` (macOS, Apple Silicon) / `.exe`
(Windows, 64-bit) from [Releases](https://github.com/Devlin-Peck/peck-releases/releases).
Installed apps update themselves from here automatically.

Source lives in the private [`Devlin-Peck/peck`](https://github.com/Devlin-Peck/peck)
repo; this repo only hosts installers and the download page. (Earlier releases
were published under the app's previous names, Woodpecker and Grove.)

## The download page

`index.html` + `site.js` are served as-is by GitHub Pages at
[peck.devlin.ai](https://peck.devlin.ai) (`CNAME`). There is no build step and
no third-party script: the page self-hosts one font, sets no cookies and
collects nothing.

- On load, `site.js` detects macOS vs Windows and puts that installer first.
- It then asks `api.github.com/repos/Devlin-Peck/peck-releases/releases/latest`
  for the current version and links the buttons straight to the installers.
  If that lookup fails (or JS is off) the buttons still work: they point at the
  Releases page, so nothing on the page ever needs updating when a version ships.
- The macOS build is Apple Silicon only; the Windows build is x64 only. The
  page says so.

Test the pure helpers (platform detection, asset picking) with:

```bash
node --test site.test.mjs
```

Preview locally with any static server, e.g. `python3 -m http.server 8000`.
