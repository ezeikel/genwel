const { withDangerousMod } = require('expo/config-plugins');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

/**
 * Keep CocoaPods on Expo's default static-library layout while giving the two
 * Google Sign-In dependencies that need Swift module maps modular headers.
 * This is regenerated on every prebuild, so no generated Podfile edit is
 * required. It also avoids `use_frameworks!`, which breaks Skia's header map.
 */
const MODULAR_HEADER_PODS = ['GoogleUtilities', 'RecaptchaInterop'];

const withModularHeaders = (config) =>
  withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = readFileSync(podfilePath, 'utf8');
      const marker = 'use_expo_modules!';
      if (
        contents.includes(marker) &&
        !contents.includes('# modular-headers')
      ) {
        const lines = MODULAR_HEADER_PODS.map(
          (name) => `  pod '${name}', :modular_headers => true`,
        ).join('\n');
        contents = contents.replace(
          marker,
          `${marker}\n\n  # modular-headers: AppCheckCore (via Google Sign-In) needs these as modules\n${lines}`,
        );
        writeFileSync(podfilePath, contents);
      }
      return cfg;
    },
  ]);

module.exports = withModularHeaders;
