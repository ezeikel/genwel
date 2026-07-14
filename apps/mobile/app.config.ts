import { ConfigContext, ExpoConfig } from 'expo/config';
import { type ConfigPlugin, withGradleProperties } from 'expo/config-plugins';
import { existsSync } from 'fs';
import { join } from 'path';
import pkg from './package.json';

const GRADLE_JVMARGS = '-Xmx6144m -XX:MaxMetaspaceSize=1024m';

// Apply the shared release-build heap settings on every prebuild instead of
// editing generated Android files.
const withGradleHeap: ConfigPlugin = (config) =>
  withGradleProperties(config, (gradleConfig) => {
    const existing = gradleConfig.modResults.find(
      (item) => item.type === 'property' && item.key === 'org.gradle.jvmargs',
    );
    if (existing?.type === 'property') {
      existing.value = GRADLE_JVMARGS;
    } else {
      gradleConfig.modResults.push({
        type: 'property',
        key: 'org.gradle.jvmargs',
        value: GRADLE_JVMARGS,
      });
    }
    return gradleConfig;
  });

// Per-variant app identity (same pattern as go-unbeaten / titrra / cadem).
// EXPO_PUBLIC_ENVIRONMENT is set per EAS build profile (eas.json) so dev /
// preview / prod produce DIFFERENT bundle ids + names and can install
// side-by-side on one device.
const env = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';

const appName =
  env === 'production'
    ? 'Genwel'
    : env === 'preview'
      ? 'Genwel Internal'
      : 'Genwel Dev';

const bundleId =
  env === 'production'
    ? 'com.chewybytes.genwel.app'
    : env === 'preview'
      ? 'com.chewybytes.genwel.app.internal'
      : 'com.chewybytes.genwel.app.dev';

// Allow cleartext (http://) in dev + preview ONLY so on-device testing can hit a
// local / staging API. Production stays https-only.
const allowCleartext = env !== 'production';

// Native sign-in (Google + Apple). The Google iOS client id is reversed into a
// URL scheme (com.googleusercontent.apps.<id>) so the native flow can redirect
// back. Optional — a provider button hides itself when its env isn't set.
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleIosUrlScheme = googleIosClientId
  ? googleIosClientId.split('.').reverse().join('.')
  : undefined;

// Facebook needs its app id + client token in Info.plist + a fb<appId> URL
// scheme. All optional — the fbsdk plugin + button hide themselves when the env
// isn't set, so the app builds/runs without a Facebook app configured.
const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
const facebookClientToken = process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN;
const facebookConfigured = Boolean(facebookAppId && facebookClientToken);

// The EAS project id is stable across build variants. An env override supports
// a future project transfer without changing source.
const EAS_PROJECT_ID =
  process.env.EAS_PROJECT_ID ?? '53254185-1bd7-4d7b-8647-cd10bbb0020b';

export default ({ config }: ConfigContext): ExpoConfig => {
  const variantSuffix =
    env === 'production' ? '' : env === 'preview' ? '-preview' : '-dev';
  const pickIcon = (base: string): string => {
    const variantPath = `./assets/images/${base}${variantSuffix}.png`;
    return existsSync(join(__dirname, variantPath))
      ? variantPath
      : `./assets/images/${base}.png`;
  };

  const plugins: NonNullable<ExpoConfig['plugins']> = [
    'expo-router',
    // Native sign-in: Apple + Google, plus SecureStore for the session token.
    'expo-secure-store',
    'expo-apple-authentication',
    '@react-native-google-signin/google-signin',
    // Keep CocoaPods on static libraries (Skia's supported layout) while
    // exposing the two Google Sign-In pods that Swift needs as modules.
    './plugins/withModularHeaders',
    // Facebook SDK (native FB login). Only added when the FB env is present.
    ...(facebookConfigured
      ? [
          [
            'react-native-fbsdk-next',
            {
              appID: facebookAppId,
              clientToken: facebookClientToken,
              displayName: 'Genwel',
              scheme: `fb${facebookAppId}`,
              isAutoInitEnabled: true,
              autoLogAppEventsEnabled: false,
              advertiserIDCollectionEnabled: false,
            },
          ] as [string, Record<string, unknown>],
        ]
      : []),
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        // Brand teal — the splash mark is cream/gold so it reads on teal.
        backgroundColor: '#1a5a5a',
      },
    ],
    'expo-notifications',
    ...(env === 'development' ? ['expo-dev-client'] : []),
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: '36.0.0',
          usesCleartextTraffic: allowCleartext,
        },
        ios: {
          deploymentTarget: '16.4',
        },
      },
    ],
  ];

  const expoConfig: ExpoConfig = {
    ...config,
    name: appName,
    slug: 'genwel',
    owner: 'chewybytes',
    version: pkg.version,
    orientation: 'portrait',
    icon: pickIcon('icon'),
    scheme: 'genwel',
    userInterfaceStyle: 'light',
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/icon.png',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: bundleId,
      // Native Sign in with Apple.
      usesAppleSignIn: true,
      // Universal links so shared genwel.com URLs open the app when installed.
      associatedDomains: ['applinks:genwel.com', 'applinks:www.genwel.com'],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // Google OAuth redirect scheme (reversed iOS client id) + Facebook's
        // fb<appId> scheme. Each only present when configured.
        CFBundleURLTypes: [
          { CFBundleURLSchemes: ['genwel'] },
          ...(googleIosUrlScheme
            ? [{ CFBundleURLSchemes: [googleIosUrlScheme] }]
            : []),
          ...(facebookConfigured
            ? [{ CFBundleURLSchemes: [`fb${facebookAppId}`] }]
            : []),
        ],
        // Facebook SDK Info.plist keys (only when configured).
        ...(facebookConfigured
          ? {
              FacebookAppID: facebookAppId,
              FacebookClientToken: facebookClientToken,
              FacebookDisplayName: 'Genwel',
              LSApplicationQueriesSchemes: ['fbapi', 'fb-messenger-share-api'],
            }
          : {}),
      },
      entitlements: {
        'com.apple.developer.applesignin': ['Default'],
      },
      privacyManifests: {
        NSPrivacyTracking: false,
        NSPrivacyTrackingDomains: [],
        NSPrivacyCollectedDataTypes: [],
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
          {
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategoryFileTimestamp',
            NSPrivacyAccessedAPITypeReasons: ['C617.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
            NSPrivacyAccessedAPITypeReasons: ['E174.1'],
          },
          {
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategorySystemBootTime',
            NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
          },
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: pickIcon('adaptive-icon'),
        // Brand teal — the adaptive foreground is the cream/gold card-sleeve mark
        // on transparent, so Android composites it over teal to match the iOS/web
        // icon (bold saturated background, the way premium fintech icons work).
        backgroundColor: '#1a5a5a',
      },
      package: bundleId,
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            { scheme: 'https', host: 'genwel.com', pathPrefix: '/' },
            { scheme: 'https', host: 'www.genwel.com', pathPrefix: '/' },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: [{ scheme: 'genwel' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    plugins,
    experiments: { typedRoutes: true },
    // Expo prebuild produces a native project, where runtime policies are not
    // supported. Keep updates aligned with the shipped app version explicitly.
    runtimeVersion: pkg.version,
    updates: {
      url: EAS_PROJECT_ID ? `https://u.expo.dev/${EAS_PROJECT_ID}` : undefined,
      checkAutomatically: 'NEVER',
      fallbackToCacheTimeout: 0,
    },
    extra: {
      ...config.extra,
      eas: {
        ...(config.extra?.eas ?? {}),
        ...(EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : {}),
      },
    },
  };

  return withGradleHeap(expoConfig);
};
