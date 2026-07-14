# Project Environment

Last inspected: 2026-07-14 via the Argent environment inspector.

- Turborepo + `pnpm@10.6.1`; mobile package is `@genwel/mobile` in `apps/mobile`.
- Expo SDK 57 (`expo` 57.0.4), React Native 0.86, Expo Router, NativeWind 5 preview, Reanimated 4, Zustand, and Secure Store.
- Managed/prebuild workflow with no checked-in `ios/` or `android/` directories. Both iOS and Android are supported.
- Start with `pnpm --filter @genwel/mobile dev`; platform scripts are `dev:ios`, `dev:android`, `ios`, and `android`.
- Typecheck with `pnpm --filter @genwel/mobile check-types`; lint from the root with `pnpm lint`.
- Metro defaults to 8081. It can run beside another React Native app by using a different port and simulator; the Genwel SDK 57 smoke test used an iPhone 17 Pro with port 8082.
- Android AVDs available locally include `Pixel_9_Pro_API_Baklava` and `Pixel_Tablet_API_Baklava`.
- Production app ID is `com.chewybytes.genwel.app`; `.internal` and `.dev` variants are configured.
- EAS profiles: `development`, `preview`, `production`, and `prod-apk`. Store submission is not ready: the iOS ASC app ID is a placeholder and the Android publishing key is intentionally absent.
- RevenueCat is installed and the app/webhook integration is implemented. Store products, public SDK keys, and the App Store / Play records still need to be provisioned.
- React 19.2.3, React Native 0.86, Reanimated 4.5, and Worklets 0.10 are aligned with Expo SDK 57 and have passed native iOS/Android compilation plus iOS/Android bundle exports.

## Mobile API and rendering constraints

- Mobile uses bearer device JWTs and defaults to `https://www.genwel.com` through `lib/api.ts`; it never connects directly to the database.
- Keep API-route data assembly in plain `lib/` modules. Do not import `"use server"` action files into route handlers or pass Prisma relation objects across RSC/client boundaries.
- Static brand SVGs should use `expo-image`; reserve `react-native-svg` for charts or vectors that need element-level control.
