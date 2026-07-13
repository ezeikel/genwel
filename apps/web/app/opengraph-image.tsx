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
          {/* Logo icon */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              backgroundColor: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: colors.textLight,
              }}
            >
              G
            </span>
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
