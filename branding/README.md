# Genwel — Brand Assets

> Fleet convention: `docs` repo → `BRAND-STORE-ASSETS.md`. Salt Mammal's
> `branding/README.md` is the reference implementation.

## Figma (canonical)

**[Genwel — Brand](https://www.figma.com/design/yPNka3oWJUF23n5vq5HHlf)** (file may still show as “App Icon” in the browser title — rename when convenient).

Pages: Logo Lockups · App Icons · Store Screenshots · Social. Production / Internal / Dev tiles are on **App Icons**.

## App icon variants (Expo)

| File | Env |
|---|---|
| `apps/mobile/assets/images/icon.png` | production |
| `apps/mobile/assets/images/icon-preview.png` | preview → Internal (grid) |
| `apps/mobile/assets/images/icon-dev.png` | development → Dev (code) |

Also `adaptive-icon{,-preview,-dev}.png`. Regenerator:
`~/Development/Personal/scripts/generate-app-icon-variants.sh`

## Canonical assets

Expo icons live in `apps/mobile/assets/images/`.
