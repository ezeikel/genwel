import { faApple, faGooglePlay } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * App Store / Google Play download badges. Rendered only when
 * NEXT_PUBLIC_SHOW_APP_STORE_BADGES is enabled (feature flag) — the mobile apps
 * aren't published yet, so this stays hidden until launch. Links point at the
 * store URLs via env; falls back to '#' so nothing breaks pre-launch.
 */
export default function AppStoreBadges() {
  const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL ?? '#';
  const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? '#';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={appStoreUrl}
        className="inline-flex items-center gap-2.5 rounded-xl bg-foreground px-4 py-2.5 text-background transition-opacity hover:opacity-90"
      >
        <FontAwesomeIcon icon={faApple} className="h-6 w-6" />
        <span className="flex flex-col leading-none">
          <span className="text-[10px] opacity-80">Download on the</span>
          <span className="text-base font-semibold">App Store</span>
        </span>
      </a>
      <a
        href={playStoreUrl}
        className="inline-flex items-center gap-2.5 rounded-xl bg-foreground px-4 py-2.5 text-background transition-opacity hover:opacity-90"
      >
        <FontAwesomeIcon icon={faGooglePlay} className="h-5 w-5" />
        <span className="flex flex-col leading-none">
          <span className="text-[10px] opacity-80">Get it on</span>
          <span className="text-base font-semibold">Google Play</span>
        </span>
      </a>
    </div>
  );
}
