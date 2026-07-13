import { ImageResponse } from 'next/og';
import { accentColors, colors, OG_HEIGHT, OG_WIDTH } from '@/lib/og/constants';
import { loadOGFonts, OG_FONT_CONFIG } from '@/lib/og/fonts';

export const runtime = 'nodejs';
export const alt = 'Genwel - One Clear View of Your Money';
export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = 'image/png';

export default async function Image() {
  const [bold, semibold, regular] = await loadOGFonts();

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(145deg, ${colors.bgLight} 0%, ${colors.bgCream} 50%, #f0f5f5 100%)`,
        fontFamily: OG_FONT_CONFIG.plusJakarta.name,
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative accent stripe at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          height: '8px',
        }}
      >
        {accentColors.map((color, i) => (
          <div key={i} style={{ flex: 1, backgroundColor: color }} />
        ))}
      </div>

      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          backgroundColor: colors.accent,
          opacity: 0.1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          backgroundColor: colors.primary,
          opacity: 0.08,
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          zIndex: 1,
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Logo icon — the card-sleeve mark on a cream squircle */}
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '24px',
              backgroundColor: '#faf9f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="72" height="72" viewBox="0 0 2048 2048" fill="none">
              <path
                fill="#1a5a5a"
                d="M 1132.6 565.3 C 1146.89 555.52 1166.34 545.722 1181.8 537.465 C 1195.59 546.242 1209.6 557.186 1222.94 566.939 L 1279.57 607.914 L 1476.21 751.765 L 1618.64 855.341 L 1662.34 886.984 C 1692.04 908.473 1705.19 915.062 1705.06 955.473 C 1704.98 981.18 1705.14 997.743 1681.7 1015.02 C 1663.6 1028.35 1645.04 1041.63 1626.71 1054.87 C 1594.45 1078.45 1562.02 1101.81 1529.44 1124.94 L 1313.1 1280.74 C 1233.99 1338.33 1154.56 1395.47 1074.81 1452.17 C 1051.28 1468.84 1022.43 1492.11 999.17 1507.22 C 989.309 1513.67 978.203 1517.96 966.574 1519.83 C 941.6 1524.09 915.491 1520.14 895.013 1504.61 C 866.895 1483.3 839.343 1461.27 811.371 1439.77 L 594.102 1271.99 L 456.636 1165.44 C 434.342 1148.2 408.002 1129.99 388.269 1112.1 C 357.327 1084.06 373.181 1052.93 405.696 1038.22 C 412.447 1035.17 420.955 1028.11 427.928 1024.8 L 428.245 1024.43 C 428.102 1014.45 427.201 1002.69 429.691 992.994 C 431.229 987.008 435.739 980.813 440.778 977.219 C 454.87 967.171 469.254 957.468 483.527 947.655 L 563.108 892.788 L 796.778 731.13 L 965.951 614.25 C 998.554 591.57 1031.68 567.547 1065.24 546.456 C 1068.99 544.099 1074.08 543.662 1078.52 543.104 C 1103.66 539.943 1114.63 551.039 1132.6 565.3 z"
              />
              <path
                fill="#d4a03c"
                d="M 428.245 1024.43 C 428.102 1014.45 427.201 1002.69 429.691 992.994 C 431.229 987.008 435.739 980.813 440.778 977.219 C 454.87 967.171 469.254 957.468 483.527 947.655 L 563.108 892.788 L 796.778 731.13 L 965.951 614.25 C 998.554 591.57 1031.68 567.547 1065.24 546.456 C 1068.99 544.099 1074.08 543.662 1078.52 543.104 C 1103.66 539.943 1114.63 551.039 1132.6 565.3 C 1134.58 567.097 1137.14 569.304 1138.97 571.164 C 1090.18 598.598 1087.54 602.782 1108.88 655.301 L 1146.83 749.527 C 1152.09 762.937 1163.87 790.69 1166.56 803.396 C 1181.36 873.513 1100.48 938.115 1047.45 971.634 C 1007.86 996.664 950.35 1021.03 907.147 1041.53 L 742.025 1120.51 C 706.085 1137.85 668.889 1155.47 633.592 1173.89 C 624.62 1178.58 619.756 1181.06 611.544 1186.99 C 572.724 1158.59 534.835 1126.63 496.259 1097.36 C 477.419 1083.07 452.641 1064.24 435.065 1048.13 C 430.057 1043.54 429.872 1032.47 428.339 1026.38 L 427.928 1024.8 L 428.245 1024.43 z"
              />
            </svg>
          </div>
          <span
            style={{
              fontSize: '64px',
              fontWeight: 700,
              color: colors.primary,
              letterSpacing: '-1px',
            }}
          >
            Genwel
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: '32px',
            fontWeight: 400,
            color: colors.textSecondary,
            marginTop: '-8px',
          }}
        >
          One Clear View of Your Money
        </p>

        {/* Feature badges */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '24px',
          }}
        >
          {['See Everything', 'Spot What Leaks', 'Fix It Faster'].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  backgroundColor: colors.bgWhite,
                  color: colors.primary,
                  padding: '12px 24px',
                  borderRadius: '100px',
                  fontSize: '18px',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(26, 90, 90, 0.1)',
                }}
              >
                {feature}
              </div>
            ),
          )}
        </div>

        {/* UK Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
          }}
        >
          <span style={{ fontSize: '24px' }}>🇬🇧</span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 500,
              color: colors.textMuted,
            }}
          >
            UK Budgeting App
          </span>
        </div>
      </div>

      {/* Bottom accent stripe */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          height: '6px',
        }}
      >
        {[...accentColors].reverse().map((color, i) => (
          <div key={i} style={{ flex: 1, backgroundColor: color }} />
        ))}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: OG_FONT_CONFIG.plusJakarta.name,
          data: bold,
          weight: 700,
          style: 'normal',
        },
        {
          name: OG_FONT_CONFIG.plusJakarta.name,
          data: semibold,
          weight: 600,
          style: 'normal',
        },
        {
          name: OG_FONT_CONFIG.plusJakarta.name,
          data: regular,
          weight: 400,
          style: 'normal',
        },
      ],
    },
  );
}
