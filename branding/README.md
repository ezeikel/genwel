# Genwel — Brand Assets

> Fleet convention: `~/Development/docs/BRAND-STORE-ASSETS.md`.

## Figma — **one file only**

**[Genwel — Brand](https://www.figma.com/design/yPNka3oWJUF23n5vq5HHlf)**

| Page | Contents |
|---|---|
| **Logo Lockups** | App icon + on-dark / white / mono marks; horizontal, stacked, wordmark |
| **App Icons** | Production / Internal (purple+grid) / Dev (teal+code) 1024² |
| **Store Screenshots** | (fill as needed) |
| **Social** | (fill as needed) |

### Type

| Role | Face |
|---|---|
| **Wordmark / UI** | **Plus Jakarta Sans Bold** (web `layout.tsx` + mobile) |
| Mono | Geist Mono (data only — not wordmark) |

Do **not** use Inter for the Genwel wordmark.

_Canonical Brand file — use this link only._

## App icon variants (Expo)

| File | Env | BG |
|---|---|---|
| `icon.png` | production | Brand store art |
| `icon-preview.png` | preview → Internal | Purple `#5B2C6F` + light grid |
| `icon-dev.png` | development → Dev | Teal `#0E6655` + large code |

Wired via `pickIcon` in mobile `app.config.ts`. Regenerator:
`~/Development/Personal/scripts/generate-app-icon-variants.sh`

## Repo exports

`branding/lockups/` — mark tiles exported for Figma.
